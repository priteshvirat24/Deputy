import {
  isValidLifecycleTransition,
  LearnedTool,
  RiskLevel,
  ToolLifecycleState,
  ToolVersionRecord,
} from '@deputy/domain';

export interface ToolFilter {
  status?: ToolLifecycleState;
  riskLevel?: RiskLevel;
}

export interface IToolRepository {
  create(tool: LearnedTool): Promise<LearnedTool>;
  getById(id: string): Promise<LearnedTool | undefined>;
  getByName(name: string): Promise<LearnedTool | undefined>;
  list(filter?: ToolFilter): Promise<LearnedTool[]>;
  updateStatus(id: string, newStatus: ToolLifecycleState): Promise<LearnedTool>;
  saveVersion(record: ToolVersionRecord): Promise<void>;
  getVersion(toolId: string, version: number): Promise<ToolVersionRecord | undefined>;
  listVersions(toolId: string): Promise<ToolVersionRecord[]>;
}

export class InMemoryToolRepository implements IToolRepository {
  private tools = new Map<string, LearnedTool>();
  private versions = new Map<string, ToolVersionRecord[]>();

  public async create(tool: LearnedTool): Promise<LearnedTool> {
    if (this.tools.has(tool.toolId)) {
      throw new Error(`Tool with ID '${tool.toolId}' already exists.`);
    }

    const cloned: LearnedTool = JSON.parse(JSON.stringify(tool));
    this.tools.set(tool.toolId, cloned);

    // Automatically snapshot v1 version record
    await this.saveVersion({
      toolId: tool.toolId,
      version: tool.version,
      definition: cloned,
      createdAt: new Date(),
      changelog: 'Initial version',
    });

    return cloned;
  }

  public async getById(id: string): Promise<LearnedTool | undefined> {
    const tool = this.tools.get(id);
    return tool ? JSON.parse(JSON.stringify(tool)) : undefined;
  }

  public async getByName(name: string): Promise<LearnedTool | undefined> {
    for (const tool of this.tools.values()) {
      if (tool.name === name) {
        return JSON.parse(JSON.stringify(tool));
      }
    }
    return undefined;
  }

  public async list(filter?: ToolFilter): Promise<LearnedTool[]> {
    let result = Array.from(this.tools.values());

    if (filter?.status) {
      result = result.filter(t => t.status === filter.status);
    }
    if (filter?.riskLevel) {
      result = result.filter(t => t.riskLevel === filter.riskLevel);
    }

    return result.map(t => JSON.parse(JSON.stringify(t)));
  }

  public async updateStatus(id: string, newStatus: ToolLifecycleState): Promise<LearnedTool> {
    const tool = this.tools.get(id);
    if (!tool) {
      throw new Error(`Tool '${id}' not found.`);
    }

    if (!isValidLifecycleTransition(tool.status, newStatus)) {
      throw new Error(
        `Invalid lifecycle transition from '${tool.status}' to '${newStatus}' for tool '${id}'.`,
      );
    }

    tool.status = newStatus;
    tool.updatedAt = new Date();
    return JSON.parse(JSON.stringify(tool));
  }

  public async saveVersion(record: ToolVersionRecord): Promise<void> {
    const history = this.versions.get(record.toolId) || [];
    history.push(JSON.parse(JSON.stringify(record)));
    this.versions.set(record.toolId, history);
  }

  public async getVersion(toolId: string, version: number): Promise<ToolVersionRecord | undefined> {
    const history = this.versions.get(toolId) || [];
    const found = history.find(v => v.version === version);
    return found ? JSON.parse(JSON.stringify(found)) : undefined;
  }

  public async listVersions(toolId: string): Promise<ToolVersionRecord[]> {
    const history = this.versions.get(toolId) || [];
    return history.map(v => JSON.parse(JSON.stringify(v)));
  }
}
