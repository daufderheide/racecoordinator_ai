import { TestBed } from "@angular/core/testing";
import { DataService } from "@app/data.service";

import { AvatarUrlPipe } from "./avatar-url.pipe";

describe("AvatarUrlPipe", () => {
  let pipe: AvatarUrlPipe;
  let dataServiceSpy: jasmine.SpyObj<DataService>;

  beforeEach(() => {
    dataServiceSpy = jasmine.createSpyObj("DataService", ["resolveAssetUrl"], {
      serverUrl: "http://localhost:7070",
    });
    dataServiceSpy.resolveAssetUrl.and.callFake((url?: string) => {
      if (!url) return "";
      if (url.includes("helmet_yellow")) {
        return "/assets/default_black-yellow_Helmet_Black-Yellow";
      }
      return url;
    });

    TestBed.configureTestingModule({
      providers: [
        AvatarUrlPipe,
        { provide: DataService, useValue: dataServiceSpy },
      ],
    });

    pipe = TestBed.inject(AvatarUrlPipe);
  });

  it("should create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it("should return default avatar for null or empty url", () => {
    expect(pipe.transform(undefined)).toBe("assets/images/default_avatar.svg");
    expect(pipe.transform("")).toBe("assets/images/default_avatar.svg");
  });

  it("should prefix absolute path with serverUrl", () => {
    expect(pipe.transform("/assets/my_avatar.png")).toBe(
      "http://localhost:7070/assets/my_avatar.png",
    );
  });

  it("should resolve helmet alias and prefix with serverUrl", () => {
    expect(pipe.transform("assets/defaults/helmets/helmet_yellow.png")).toBe(
      "http://localhost:7070/assets/default_black-yellow_Helmet_Black-Yellow",
    );
  });

  it("should return external http url directly", () => {
    expect(pipe.transform("http://example.com/avatar.jpg")).toBe(
      "http://example.com/avatar.jpg",
    );
  });
});
