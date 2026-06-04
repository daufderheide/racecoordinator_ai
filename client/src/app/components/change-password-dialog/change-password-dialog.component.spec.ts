import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { AuthService } from "@app/services/auth.service";

import { ChangePasswordDialogComponent } from "./change-password-dialog.component";

describe("ChangePasswordDialogComponent", () => {
  let component: ChangePasswordDialogComponent;
  let fixture: ComponentFixture<ChangePasswordDialogComponent>;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      changeDirectorPassword: jasmine
        .createSpy("changeDirectorPassword")
        .and.returnValue(of(true)),
      getDirectorPassword: jasmine
        .createSpy("getDirectorPassword")
        .and.returnValue(of("current-secret")),
    };

    await TestBed.configureTestingModule({
      imports: [ChangePasswordDialogComponent],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should fetch current password and set newPassword to it on visible", () => {
    expect(mockAuthService.getDirectorPassword).toHaveBeenCalled();
    expect(component.newPassword).toBe("current-secret");
  });

  it("should default showPassword to false and close reset state", () => {
    component.showPassword = true;
    component.closeDialog();
    expect(component.showPassword).toBeFalse();
  });

  it("should emit close when closeDialog is called", () => {
    spyOn(component.close, "emit");
    component.newPassword = "some-password";
    component.errorMsg = "some-error";

    component.closeDialog();

    expect(component.newPassword).toBe("");
    expect(component.errorMsg).toBe("");
    expect(component.close.emit).toHaveBeenCalled();
  });

  it("should call authService and close dialog on submit (success)", () => {
    spyOn(component.close, "emit");
    component.newPassword = "new-secret";

    component.submit();

    expect(component.errorMsg).toBe("");
    expect(mockAuthService.changeDirectorPassword).toHaveBeenCalledWith(
      "new-secret",
    );
    expect(component.close.emit).toHaveBeenCalled();
  });

  it("should set errorMsg and showFailureModal on submit (failure)", () => {
    spyOn(component.close, "emit");
    mockAuthService.changeDirectorPassword.and.returnValue(of(false));
    component.newPassword = "new-secret";

    component.submit();

    expect(mockAuthService.changeDirectorPassword).toHaveBeenCalledWith(
      "new-secret",
    );
    expect(component.errorMsg).toBe(
      "Failed to change password. See console for details.",
    );
    expect(component.showFailureModal).toBeTrue();
    expect(component.close.emit).not.toHaveBeenCalled();
  });
});
