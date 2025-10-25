import { Test } from '@nestjs/testing';

import { AuthPasswordService } from './auth-password.service';

describe('AuthPasswordService', () => {
  it('hashes and compares passwords correctly', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AuthPasswordService],
    }).compile();

    const service = moduleRef.get(AuthPasswordService);

    const password = 'secret123';
    const hash = await service.hash(password);
    expect(hash).not.toBe(password);

    const matches = await service.compare(password, hash);
    expect(matches).toBe(true);

    const mismatch = await service.compare('wrong', hash);
    expect(mismatch).toBe(false);
  });
});
