import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock the database module
vi.mock("./db", () => ({
  createTrainingSession: vi.fn(),
  updateTrainingSession: vi.fn(),
  createTrialData: vi.fn(),
  getUserTrainingSessions: vi.fn(),
  getTrainingSession: vi.fn(),
  getSessionTrials: vi.fn(),
  getUserStats: vi.fn(),
  getUserTrials: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user-" + userId,
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("training.createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new training session for authenticated user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    
    vi.mocked(db.createTrainingSession).mockResolvedValue(123);

    const result = await caller.training.createSession({
      gameType: "schulte",
      difficulty: "medium",
      startedAt: Date.now(),
    });

    expect(result).toEqual({ sessionId: 123 });
    expect(db.createTrainingSession).toHaveBeenCalledWith({
      userId: 1,
      gameType: "schulte",
      difficulty: "medium",
      startedAt: expect.any(Number),
    });
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.training.createSession({
        gameType: "schulte",
        difficulty: "easy",
        startedAt: Date.now(),
      })
    ).rejects.toThrow();
  });
});

describe("training.completeSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("completes a training session with metrics", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.getTrainingSession).mockResolvedValue({ userId: 1 } as any);
    
    vi.mocked(db.updateTrainingSession).mockResolvedValue(undefined);

    const result = await caller.training.completeSession({
      sessionId: 123,
      completedAt: Date.now(),
      totalTrials: 25,
      correctTrials: 20,
      totalTime: 45000,
      meanRt: 500,
      medianRt: 480,
      sdRt: 120,
      minRt: 300,
      maxRt: 800,
      rtv: 0.24,
      gameMetrics: { gridSize: 5 },
    });

    expect(result).toEqual({ success: true });
    expect(db.updateTrainingSession).toHaveBeenCalledWith(123, {
      completed: true,
      completedAt: expect.any(Number),
      totalTrials: 25,
      correctTrials: 20,
      totalTime: 45000,
      meanRt: 500,
      medianRt: 480,
      sdRt: 120,
      minRt: 300,
      maxRt: 800,
      rtv: 0.24,
      gameMetrics: { gridSize: 5 },
    });
  });
});

describe("training.saveTrials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves trial data with user ID", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.getTrainingSession).mockResolvedValue({ userId: 1 } as any);
    
    vi.mocked(db.createTrialData).mockResolvedValue(undefined);

    const trials = [
      {
        sessionId: 123,
        trialNumber: 1,
        stimulusType: "target",
        correct: true,
      },
      {
        sessionId: 123,
        trialNumber: 2,
        stimulusType: "distractor",
        reactionTime: -1,
        correct: false,
      },
    ];

    const result = await caller.training.saveTrials({ trials });

    expect(result).toEqual({ success: true });
    expect(db.createTrialData).toHaveBeenCalledWith([
      { ...trials[0], userId: 1 },
      { ...trials[1], userId: 1 },
    ]);
  });

  it("rejects completing another user's session", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.getTrainingSession).mockResolvedValue({ userId: 2 } as any);

    await expect(
      caller.training.completeSession({
        sessionId: 123,
        completedAt: Date.now(),
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.updateTrainingSession).not.toHaveBeenCalled();
  });

  it("rejects saving trials to another user's session", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.getTrainingSession).mockResolvedValue({ userId: 2 } as any);

    await expect(
      caller.training.saveTrials({
        trials: [{
          sessionId: 123,
          trialNumber: 1,
          correct: true,
        }],
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.createTrialData).not.toHaveBeenCalled();
  });

  it("rejects oversized trial batches before touching the database", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const trials = Array.from({ length: 1001 }, (_, index) => ({
      sessionId: 123,
      trialNumber: index + 1,
      correct: true,
    }));

    await expect(caller.training.saveTrials({ trials })).rejects.toThrow();
    expect(db.getTrainingSession).not.toHaveBeenCalled();
    expect(db.createTrialData).not.toHaveBeenCalled();
  });
});

describe("training.toggleSessionStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses a not-found error for another user's session", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.getTrainingSession).mockResolvedValue({ userId: 2 } as any);

    await expect(
      caller.training.toggleSessionStats({
        sessionId: 123,
        includedInStats: false,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.updateTrainingSession).not.toHaveBeenCalled();
  });
});

describe("training.getSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user's training sessions", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    
    const mockSessions = [
      {
        id: 1,
        userId: 1,
        gameType: "schulte" as const,
        difficulty: "medium" as const,
        startedAt: Date.now(),
        completed: true,
      },
    ];
    
    vi.mocked(db.getUserTrainingSessions).mockResolvedValue(mockSessions as any);

    const result = await caller.training.getSessions({ limit: 10 });

    expect(result).toEqual(mockSessions);
    expect(db.getUserTrainingSessions).toHaveBeenCalledWith(1, { limit: 10 });
  });
});

describe("training.getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns session with trials for authorized user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    
    const mockSession = {
      id: 123,
      userId: 1,
      gameType: "schulte" as const,
      difficulty: "medium" as const,
    };
    const mockTrials = [{ id: 1, sessionId: 123, trialNumber: 1 }];
    
    vi.mocked(db.getTrainingSession).mockResolvedValue(mockSession as any);
    vi.mocked(db.getSessionTrials).mockResolvedValue(mockTrials as any);

    const result = await caller.training.getSession({ sessionId: 123 });

    expect(result).toEqual({ session: mockSession, trials: mockTrials });
  });

  it("returns null for session belonging to another user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    
    const mockSession = {
      id: 123,
      userId: 2, // Different user
      gameType: "schulte" as const,
      difficulty: "medium" as const,
    };
    
    vi.mocked(db.getTrainingSession).mockResolvedValue(mockSession as any);

    const result = await caller.training.getSession({ sessionId: 123 });

    expect(result).toBeNull();
    expect(db.getSessionTrials).not.toHaveBeenCalled();
  });
});

describe("training.getStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user statistics", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    
    const mockStats = {
      totalSessions: 10,
      totalTrials: 250,
      averageAccuracy: 85.5,
    };
    
    vi.mocked(db.getUserStats).mockResolvedValue(mockStats as any);

    const result = await caller.training.getStats();

    expect(result).toEqual(mockStats);
    expect(db.getUserStats).toHaveBeenCalledWith(1);
  });
});

describe("training.getTrials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user's trial data", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    
    const mockTrials = [
      { id: 1, sessionId: 123, trialNumber: 1, rt: 450 },
      { id: 2, sessionId: 123, trialNumber: 2, rt: 380 },
    ];
    
    vi.mocked(db.getUserTrials).mockResolvedValue(mockTrials as any);

    const result = await caller.training.getTrials({ limit: 100 });

    expect(result).toEqual(mockTrials);
    expect(db.getUserTrials).toHaveBeenCalledWith(1, { limit: 100 });
  });
});
