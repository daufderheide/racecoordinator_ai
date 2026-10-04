import { Pipe, PipeTransform } from "@angular/core";
import { DataService } from "@app/data.service";

@Pipe({
  standalone: true,
  name: "avatarUrl",
  pure: true,
})
export class AvatarUrlPipe implements PipeTransform {
  constructor(private dataService: DataService) {}

  transform(url?: string): string {
    if (!url) return "assets/images/default_avatar.svg";
    const resolved = this.dataService?.resolveAssetUrl
      ? this.dataService.resolveAssetUrl(url)
      : url;
    if (resolved && resolved.startsWith("/")) {
      return `${this.dataService.serverUrl}${resolved}`;
    }
    return resolved;
  }
}
