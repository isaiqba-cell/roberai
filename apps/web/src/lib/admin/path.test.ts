import { isAdminRequestPath } from "./path";

describe("isAdminRequestPath", () => {
  it.each(["/admin", "/admin/sources", "/api/admin", "/api/admin/actions"])(
    "protects %s",
    (pathname) => {
      expect(isAdminRequestPath(pathname)).toBe(true);
    },
  );

  it.each(["/", "/matches", "/api/matches", "/administrator"])(
    "does not hide %s",
    (pathname) => {
      expect(isAdminRequestPath(pathname)).toBe(false);
    },
  );
});
