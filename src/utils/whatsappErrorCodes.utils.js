/**
 * De/Para dos códigos de erro da WhatsApp Cloud API
 * Referência: https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes/
 */
const whatsappErrorCodes = {
    0: 'Não foi possível autenticar o usuário do aplicativo',
    2: 'Serviço da API temporariamente indisponível',
    4: 'Limite de chamadas da API atingido',
    100: 'Parâmetro inválido na requisição',
    130429: 'Limite de throughput da Cloud API atingido',
    131000: 'Erro desconhecido ao enviar a mensagem',
    131005: 'Permissão negada para enviar mensagem',
    131008: 'Parâmetro obrigatório ausente na requisição',
    131009: 'Valor do parâmetro inválido',
    131016: 'Serviço indisponível no momento',
    131021: 'Destinatário e remetente são o mesmo número',
    131026: 'Mensagem não entregue. Destinatário inválido ou versão desatualizada do WhatsApp',
    131031: 'Conta comercial bloqueada por violação de política',
    131037: 'Número precisa de aprovação do nome de exibição antes de enviar mensagens',
    131042: 'Falha ao enviar mensagem por erro no método de pagamento',
    131045: 'Número de telefone não registrado no WhatsApp',
    131047: 'Mensagem de re-engajamento. Mais de 24h desde a última resposta do destinatário',
    131048: 'Limite de spam atingido. Muitas mensagens anteriores bloqueadas ou marcadas como spam',
    131049: 'Meta optou por não entregar esta mensagem (gestão de saúde do ecossistema)',
    131050: 'Mensagem não entregue. Destinatário optou por não receber mensagens de marketing',
    131051: 'Tipo de mensagem não suportado',
    131053: 'Erro ao fazer upload da mídia. Tipo não suportado',
    131056: 'Limite de mensagens entre remetente e destinatário atingido em curto período',
    131057: 'Conta comercial em modo de manutenção',
    132000: 'Quantidade de parâmetros do template não corresponde à definição',
    132001: 'Template não existe ou nome/idioma incorreto',
    132005: 'Texto de parâmetro do template contém caracteres inválidos',
    132007: 'Template viola políticas de formatação do WhatsApp',
    132012: 'Valores dos parâmetros do template formatados incorretamente',
    132015: 'Template pausado por baixa qualidade',
    132016: 'Template desativado permanentemente por problemas repetidos de qualidade',
    133000: 'Erro na configuração do número de telefone',
    133004: 'Servidor temporariamente indisponível',
    133010: 'Número de telefone comercial não registrado na plataforma',
    133015: 'Número deletado recentemente. Aguarde 5 minutos antes de tentar novamente',
    135000: 'Erro genérico do usuário'
};

/**
 * Retorna a mensagem de erro em português para o código informado
 * @param {number} code - Código de erro da Meta
 * @returns {string} Mensagem de erro traduzida
 */
const getWhatsappErrorMessage = (code) => {
    return whatsappErrorCodes[code] || `Erro desconhecido (código: ${code})`;
};

module.exports = {
    whatsappErrorCodes,
    getWhatsappErrorMessage
};
