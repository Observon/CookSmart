import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuthSupabaseService {
  private client: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  async resetPasswordForEmail(email: string, redirectTo: string) {
    const supabase = this.getClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  getUser(accessToken: string) {
    const supabase = this.getClient();
    return supabase.auth.getUser(accessToken);
  }

  private getClient(): SupabaseClient {
    if (this.client) {
      return this.client;
    }

    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !serviceRoleKey) {
      throw new Error('Supabase credentials are not configured');
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    return this.client;
  }
}
