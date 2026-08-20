"""Renovacao automatica de vigencia (data_fim) de licencas ativas vencidas.

Chamada no inicio de qualquer endpoint que le licencas (ver
specs/renovacao-automatica-licencas/spec.md), garantindo que a leitura
sempre reflita a vigencia ja renovada, sem depender de um job agendado.

A renovacao so pode mudar alguma linha uma vez por dia (data_fim tem
granularidade de dia), entao o UPDATE fica em cache por processo: roda no
maximo uma vez por dia, evitando pagar um UPDATE+commit em praticamente
toda leitura do portal (Portal Contabil, licencas, One Page).
"""

from datetime import date

_ultima_execucao: date | None = None

_RENOVAR_SQL = """
update licencas
set
    data_fim = data_fim + (
        ceil(
            (current_date - data_fim)::numeric /
            case periodicidade when 'anual' then 365 else 30 end
        ) * case periodicidade when 'anual' then interval '1 year' else interval '1 month' end
    ),
    ultima_renovacao_em = now()
where status = 'ativa'
  and data_fim is not null
  and data_fim < current_date
returning id;
"""


def renovar_licencas_vencidas(conn) -> int:
    global _ultima_execucao
    hoje = date.today()
    if _ultima_execucao == hoje:
        return 0
    with conn.cursor() as cur:
        cur.execute(_RENOVAR_SQL)
        renovadas = cur.fetchall()
    conn.commit()
    _ultima_execucao = hoje
    return len(renovadas)
