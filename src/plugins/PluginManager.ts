export type ElgPackage = {
  format: 'ELG/1'; id: string; name: string; version: string; description?: string;
  entrypoint: string; permissions: string[]; files: Record<string, string>;
};

const allowedPermissions = new Set(['project.read','project.write','scene.read','scene.write','assets.read','assets.write','ui.notify']);
export class PluginManager {
  async inspect(file: File): Promise<ElgPackage> {
    if (!file.name.toLowerCase().endsWith('.elg')) throw new Error('Plugin must use the .elg extension');
    const raw = JSON.parse(await file.text()) as Partial<ElgPackage>;
    if (raw.format !== 'ELG/1' || !raw.id || !raw.name || !raw.version || !raw.entrypoint || !raw.files) {
      throw new Error('Invalid ELG/1 package manifest');
    }
    const permissions = raw.permissions ?? [];
    const invalid = permissions.filter(permission => !allowedPermissions.has(permission));
    if (invalid.length) throw new Error(`Unsupported permissions: ${invalid.join(', ')}`);
    if (!(raw.entrypoint in raw.files)) throw new Error('ELG entrypoint is missing from files');
    return raw as ElgPackage;
  }
}
