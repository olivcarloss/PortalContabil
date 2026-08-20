import { api } from "./client";

export interface ContatoForm {
  nome: string;
  email: string;
  escritorio?: string;
  assunto?: string;
  mensagem: string;
}

export const publicApi = {
  enviarContato: (payload: ContatoForm) =>
    api.post<{ enviado: boolean }>("/public/contato", payload),
};
