import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { DataService } from "@app/data.service";
import { Role } from "@app/models/role";
import { LoggerService } from "@app/services/logger.service";

import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let dataServiceMock: any;
  let loggerServiceMock: any;

  beforeEach(() => {
    dataServiceMock = {
      serverUrl: "http://localhost:7070",
    };

    loggerServiceMock = jasmine.createSpyObj("LoggerService", [
      "debug",
      "info",
      "warn",
      "error",
      "log",
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: DataService, useValue: dataServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Handle initial checkRole call in constructor
    const req = httpMock.expectOne("http://localhost:7070/api/auth/role");
    req.flush({ role: Role.VIEWER });
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("loginAsDirector", () => {
    it("should set tokens and role on successful login", () => {
      service.loginAsDirector("secret").subscribe((success) => {
        expect(success).toBeTrue();
        expect(localStorage.getItem("director_token")).toBe("fake-token");
        expect(localStorage.getItem("director_password")).toBe("secret");
        expect(service.currentRole).toBe(Role.DIRECTOR);
      });

      const req = httpMock.expectOne("http://localhost:7070/api/auth/login");
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual({ password: "secret" });
      req.flush({ token: "fake-token", role: Role.DIRECTOR });
    });

    it("should handle login failure", () => {
      service.loginAsDirector("wrong").subscribe((success) => {
        expect(success).toBeFalse();
      });

      const req = httpMock.expectOne("http://localhost:7070/api/auth/login");
      req.flush(
        { success: false, error: "Invalid password" },
        { status: 401, statusText: "Unauthorized" },
      );
    });
  });

  describe("changeDirectorPassword", () => {
    it("should change password and update local storage if already saved", () => {
      localStorage.setItem("director_password", "old-secret");

      service.changeDirectorPassword("new-secret").subscribe((success) => {
        expect(success).toBeTrue();
        expect(localStorage.getItem("director_password")).toBe("new-secret");
      });

      const req = httpMock.expectOne("http://localhost:7070/api/auth/password");
      expect(req.request.method).toBe("PUT");
      expect(req.request.body).toEqual({ newPassword: "new-secret" });
      req.flush({ success: true });
    });
  });

  describe("getDirectorPassword", () => {
    it("should fetch password from the backend", () => {
      service.getDirectorPassword().subscribe((password) => {
        expect(password).toBe("rc-ai-pass");
      });

      const req = httpMock.expectOne("http://localhost:7070/api/auth/password");
      expect(req.request.method).toBe("GET");
      req.flush({ password: "rc-ai-pass" });
    });

    it("should return empty string on error", () => {
      service.getDirectorPassword().subscribe((password) => {
        expect(password).toBe("");
      });

      const req = httpMock.expectOne("http://localhost:7070/api/auth/password");
      req.flush(null, { status: 500, statusText: "Server Error" });
    });
  });

  describe("logout", () => {
    it("should clear storage and fetch role", () => {
      localStorage.setItem("director_token", "token");
      localStorage.setItem("director_password", "pass");

      service.logout();

      expect(localStorage.getItem("director_token")).toBeNull();
      expect(localStorage.getItem("director_password")).toBeNull();

      const req = httpMock.expectOne("http://localhost:7070/api/auth/role");
      req.flush({ role: Role.VIEWER });
    });
  });
});
