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

  it("should set errorMsg on submit (failure)", () => {
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
    expect(component.close.emit).not.toHaveBeenCalled();
  });
});
