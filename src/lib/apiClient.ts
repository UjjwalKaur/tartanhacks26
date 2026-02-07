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

  async createCheckIn(checkIn: CheckIn): Promise<any> {
    // Always use the real backend endpoint for check-ins
    const response = await fetch('/api/checkins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkIn),
    });

    if (!response.ok) {
      throw new Error(`Failed to create check-in: ${response.status}`);
    }

    const data = await response.json();
    return {
      checkIn: CheckInRecordSchema.parse(data.checkIn),
      analysis: data.analysis,
    };
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

  async analyzeSpending(): Promise<any> {
    const response = await fetch('/api/analyze/spending', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to analyze spending: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }
}

export const apiClient = new ApiClient(API_URL, USE_MOCK);
