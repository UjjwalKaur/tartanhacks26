import {
  DashboardPayload,
  DashboardPayloadSchema,
  TransactionsSummary,
  TransactionsSummarySchema,
  HealthSummary,
  HealthSummarySchema,
  CheckIn,
  CheckInRecord,
  CheckInRecordSchema,
} from '@/types/schemas';
import {
  mockDashboardData,
  mockTransactionsSummary,
  mockHealthSummary,
  mockCheckIns,
} from '@/lib/mockData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false'; // Default to true

// Simulated network delay for mock data
const mockDelay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

class ApiClient {
  private baseUrl: string;
  private useMock: boolean;

  constructor(baseUrl: string, useMock: boolean) {
    this.baseUrl = baseUrl;
    this.useMock = useMock;
  }

  private async fetchWithValidation<T>(
    endpoint: string,
    schema: any,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return schema.parse(data);
  }

  async getDashboard(): Promise<DashboardPayload> {
    if (this.useMock) {
      await mockDelay();
      return mockDashboardData;
    }
    return this.fetchWithValidation<DashboardPayload>(
      '/dashboard',
      DashboardPayloadSchema
    );
  }

  async createCheckIn(checkIn: CheckIn): Promise<CheckInRecord> {
    if (this.useMock) {
      await mockDelay(500);
      const newCheckIn: CheckInRecord = {
        id: `ci-${Date.now()}`,
        date: checkIn.date || new Date().toISOString().split('T')[0],
        ...checkIn,
      };
      mockCheckIns.unshift(newCheckIn);
      return newCheckIn;
    }
    return this.fetchWithValidation<CheckInRecord>(
      '/checkins',
      CheckInRecordSchema,
      {
        method: 'POST',
        body: JSON.stringify(checkIn),
      }
    );
  }

  async getTransactionsSummary(): Promise<TransactionsSummary> {
    if (this.useMock) {
      await mockDelay();
      return mockTransactionsSummary;
    }
    return this.fetchWithValidation<TransactionsSummary>(
      '/transactions/summary',
      TransactionsSummarySchema
    );
  }

  async getHealthSummary(): Promise<HealthSummary> {
    if (this.useMock) {
      await mockDelay();
      return mockHealthSummary;
    }
    return this.fetchWithValidation<HealthSummary>(
      '/health/summary',
      HealthSummarySchema
    );
  }

  async getCheckIns(): Promise<CheckInRecord[]> {
    if (this.useMock) {
      await mockDelay();
      return mockCheckIns;
    }
    // Assuming there's a GET /checkins endpoint
    const response = await fetch(`${this.baseUrl}/checkins`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data.map((item: any) => CheckInRecordSchema.parse(item));
  }
}

export const apiClient = new ApiClient(API_URL, USE_MOCK);
