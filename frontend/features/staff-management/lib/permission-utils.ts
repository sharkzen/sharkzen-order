import { RESOURCES } from "../data/permissions";
import type { PermissionKey, ResourceDef, Role } from "../types";

export const permissionKey = (resource: ResourceDef, actionId: string) =>
  `${resource.id}.${actionId}`;

export function allPermissions(): PermissionKey[] {
  return RESOURCES.flatMap((resource) =>
    resource.actions.map((action) => permissionKey(resource, action.id)),
  );
}

export function canView(permissions: PermissionKey[], resource: ResourceDef) {
  return permissions.includes(permissionKey(resource, "view"));
}

/** หน้าที่เข้าได้ */
export function accessibleResources(permissions: PermissionKey[]) {
  return RESOURCES.filter((resource) => canView(permissions, resource));
}

/**
 * เปิด/ปิดสิทธิ์หนึ่งข้อ โดยรักษากฎว่าการกระทำใดๆ ต้องเข้าหน้านั้นได้ก่อน
 * ปิด "เข้าหน้านี้ได้" = ปิดทุกการกระทำของหน้านั้น / เปิดการกระทำ = เปิด "เข้าหน้านี้ได้" ให้ด้วย
 */
export function setPermission(
  permissions: PermissionKey[],
  resource: ResourceDef,
  actionId: string,
  enabled: boolean,
): PermissionKey[] {
  const own = resource.actions.map((action) =>
    permissionKey(resource, action.id),
  );
  const view = permissionKey(resource, "view");
  const key = permissionKey(resource, actionId);
  const next = new Set(permissions);

  if (enabled) {
    next.add(key);
    next.add(view);
  } else if (actionId === "view") {
    own.forEach((item) => next.delete(item));
  } else {
    next.delete(key);
  }
  return [...next];
}

export function sameSet(a: PermissionKey[], b: PermissionKey[]) {
  return a.length === b.length && a.every((item) => b.includes(item));
}

/** "เข้าได้ 6 จาก 8 หน้า" */
export function accessSummary(role: Role | undefined) {
  const count = role ? accessibleResources(role.permissions).length : 0;
  return `เข้าได้ ${count} จาก ${RESOURCES.length} หน้า`;
}
