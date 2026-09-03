import { Demonstration, DemonstrationStatus, SemanticAction } from '@deputy/domain';

export interface DemonstrationFilter {
  actorId?: string;
  status?: DemonstrationStatus;
}

export interface IDemonstrationRepository {
  create(demo: Demonstration): Promise<Demonstration>;
  getById(id: string): Promise<Demonstration | undefined>;
  list(filter?: DemonstrationFilter): Promise<Demonstration[]>;
  addActions(demonstrationId: string, actions: SemanticAction[]): Promise<void>;
  updateStatus(id: string, status: DemonstrationStatus): Promise<Demonstration>;
}

export class InMemoryDemonstrationRepository implements IDemonstrationRepository {
  private demos = new Map<string, Demonstration>();

  public async create(demo: Demonstration): Promise<Demonstration> {
    if (this.demos.has(demo.demonstrationId)) {
      throw new Error(`Demonstration '${demo.demonstrationId}' already exists.`);
    }

    const cloned: Demonstration = JSON.parse(JSON.stringify(demo));
    this.demos.set(demo.demonstrationId, cloned);
    return cloned;
  }

  public async getById(id: string): Promise<Demonstration | undefined> {
    const demo = this.demos.get(id);
    return demo ? JSON.parse(JSON.stringify(demo)) : undefined;
  }

  public async list(filter?: DemonstrationFilter): Promise<Demonstration[]> {
    let result = Array.from(this.demos.values());

    if (filter?.actorId) {
      result = result.filter(d => d.actorId === filter.actorId);
    }
    if (filter?.status) {
      result = result.filter(d => d.status === filter.status);
    }

    return result.map(d => JSON.parse(JSON.stringify(d)));
  }

  public async addActions(demonstrationId: string, actions: SemanticAction[]): Promise<void> {
    const demo = this.demos.get(demonstrationId);
    if (!demo) {
      throw new Error(`Demonstration '${demonstrationId}' not found.`);
    }

    demo.actions.push(...JSON.parse(JSON.stringify(actions)));
  }

  public async updateStatus(id: string, status: DemonstrationStatus): Promise<Demonstration> {
    const demo = this.demos.get(id);
    if (!demo) {
      throw new Error(`Demonstration '${id}' not found.`);
    }

    demo.status = status;
    if (status === 'COMPLETED' || status === 'DISCARDED') {
      demo.completedAt = new Date();
    }

    return JSON.parse(JSON.stringify(demo));
  }
}
