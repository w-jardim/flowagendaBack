export const MensagensTemplate = {
  CONFIRMACAO: (cliente: string, profissional: string, servico: string, data: string) =>
    `Olá ${cliente}! seu agendamento de ${servico} com ${profissional} para o dia ${data} foi confirmado com sucesso! ✅`,

  LEMBRETE: (cliente: string, hora: string) =>
    `Olá ${cliente}, passando para lembrar do seu horário hoje às ${hora}. Até logo! 😊`,
};