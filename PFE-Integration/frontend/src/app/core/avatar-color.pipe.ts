import { Pipe, PipeTransform } from '@angular/core';
import { ApiService } from './api.service';

@Pipe({
  name: 'avatarColor',
  standalone: true
})
export class AvatarColorPipe implements PipeTransform {
  constructor(private readonly api: ApiService) {}

  /**
   * Resolves the avatar CSS class for a user.
   * Priority: precomputed avatar from backend > computed from identifier (email).
   * @param identifier - The email or name string to compute avatar from (fallback)
   * @param precomputed - Optional pre-stored avatar class from backend (e.g. 'avatar-bg-3')
   */
  transform(identifier: string | undefined | null, precomputed?: string | null): string {
    // If a valid precomputed avatar class is provided from the backend, use it directly
    if (precomputed && precomputed.startsWith('avatar-bg-')) {
      return precomputed;
    }
    return this.api.getAvatarColor(identifier);
  }
}
