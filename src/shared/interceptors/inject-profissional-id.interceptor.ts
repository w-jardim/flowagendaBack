import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class InjectProfissionalIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();

    if (req && req.user && req.body && typeof req.body === 'object') {
      // Inject profissional_id when missing
      if (!req.body.profissional_id) {
        req.body.profissional_id = req.user.id;
      }

      // Map alias 'duracao' to canonical 'duracao_minutos' and remove alias
      if (req.body.duracao !== undefined && req.body.duracao_minutos === undefined) {
        const v = Number(req.body.duracao);
        if (!Number.isNaN(v)) {
          req.body.duracao_minutos = v;
        }
        delete req.body.duracao;
      }

      // Ensure numeric fields are numbers (simple normalization)
      if (req.body.duracao_minutos !== undefined) {
        const n = Number(req.body.duracao_minutos);
        if (!Number.isNaN(n)) req.body.duracao_minutos = n;
      }
      if (req.body.intervalo_minutos !== undefined) {
        const n = Number(req.body.intervalo_minutos);
        if (!Number.isNaN(n)) req.body.intervalo_minutos = n;
      }
    }

    return next.handle();
  }
}
