import { Pipe, PipeTransform } from "@angular/core";
import { DataService } from "src/app/data.service";

@Pipe({
  standalone: true,
  name: "avatarUrl",
  pure: true,
})
export class AvatarUrlPipe implements PipeTransform {
  constructor(private dataService: DataService) {}

  transform(url?: string): string {
    if (!url) return "assets/images/default_avatar.svg";
    if (url.startsWith("/")) return `${this.dataService.serverUrl}${url}`;
    return url;
  }
}
