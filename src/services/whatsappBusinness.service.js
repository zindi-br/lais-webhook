const { addLogs } = require('../helpers/logs.helper');
const { sendEventWebhook } = require('../helpers/webhook.helper');
const { transformMessageWbo } = require('../utils/transformMessageWbo.utils');
const { processWebhookWhatsapp } = require('./processWebhook.service');
const TemplateWhatsappBusiness = require('../models/TemplatesWhatsapp');
const TemplatesWhatsappCategoryLogs = require('../models/TemplatesWhatsappCategoryLogs');
const PricingEventsWhatsapp = require('../models/PricingEventsWhatsapp');
const Canais = require('../models/Canais');
const WhatsappMensagens = require('../models/WhatsappMensagens');
const { getWhatsappErrorMessage } = require('../utils/whatsappErrorCodes.utils');

/**
 * Processa o evento de atualização de categoria de template do WhatsApp Business API
 * @param {Object} webhookData - Dados do webhook recebido
 * @param {string} session - Sessão do cliente
 * @param {string} clienteId - ID do cliente
 */
const processTemplateCategoryUpdate = async (webhookData, session, clienteId) => {
    try {

        const { entry } = webhookData;

        if (!entry || !Array.isArray(entry) || entry.length === 0) {
            console.log('Entrada inválida no webhook template_category_update');
            return;
        }

        const entryData = entry[0];
        const { changes } = entryData;

        if (!changes || !Array.isArray(changes) || changes.length === 0) {
            console.log('Mudanças não encontradas no webhook template_category_update');
            return;
        }

        const change = changes[0];

        if (change.field !== 'template_category_update') {
            console.log('Campo não é template_category_update:', change.field);
            return;
        }

        const templateData = change.value;

        if (!templateData) {
            console.log('Dados do template não encontrados');
            return;
        }

        const {
            message_template_id,
            message_template_name,
            message_template_language,
            previous_category,
            new_category,
            correct_category
        } = templateData;

        // Log do evento para auditoria
        await addLogs('template_category_update', {
            session,
            clienteId,
            templateId: message_template_id,
            templateName: message_template_name,
            templateLanguage: message_template_language,
            previousCategory: previous_category,
            newCategory: new_category,
            correctCategory: correct_category,
            timestamp: new Date().toISOString()
        });

        // Buscar template antes de atualizar para obter _id e canalId
        const templateLocal = await TemplateWhatsappBusiness.findOne({
            templateId: message_template_id
        });

        // Atualizar o status do template no banco de dados
        await TemplateWhatsappBusiness.updateOne({
            templateId: message_template_id
        }, {
            category: new_category
        });

        // Registrar log de alteração de categoria
        if (templateLocal) {
            await TemplatesWhatsappCategoryLogs.create({
                templateId: templateLocal._id,
                metaTemplateId: message_template_id,
                templateName: message_template_name,
                categoryAnterior: previous_category,
                categoryNova: new_category,
                canalId: templateLocal.canalId,
                cliente_id: clienteId
            });
            console.log(`📝 Log de alteração de categoria registrado para template ${message_template_name}`);
        }

        console.log(`Template ${message_template_name} (ID: ${message_template_id}) teve categoria alterada de ${previous_category} para ${new_category}`);

        // Se a categoria correta foi fornecida e é diferente da nova categoria,
        // pode indicar que houve um erro na categorização
        if (correct_category && correct_category !== new_category) {
            console.log(`⚠️ ATENÇÃO: A categoria correta deveria ser ${correct_category}, mas foi definida como ${new_category}`);

            // Log de alerta
            await addLogs('template_category_warning', {
                session,
                clienteId,
                templateId: message_template_id,
                templateName: message_template_name,
                expectedCategory: correct_category,
                actualCategory: new_category,
                timestamp: new Date().toISOString()
            });
        }

        // Retornar dados processados para possível uso posterior
        return {
            success: true,
            templateId: message_template_id,
            templateName: message_template_name,
            previousCategory: previous_category,
            newCategory: new_category,
            correctCategory: correct_category,
            hasWarning: correct_category && correct_category !== new_category
        };

    } catch (error) {
        console.error('Erro ao processar template_category_update:', error);

        // Log do erro
        await addLogs('template_category_update_error', {
            session,
            clienteId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Processa o evento de atualização de status de template do WhatsApp Business API
 * @param {Object} webhookData - Dados do webhook recebido
 * @param {string} session - Sessão do cliente
 * @param {string} clienteId - ID do cliente
 */
const processTemplateStatusUpdate = async (webhookData, session, clienteId) => {
    try {
        console.log('Processando evento message_template_status_update:', JSON.stringify(webhookData, null, 2));

        const { entry } = webhookData;

        if (!entry || !Array.isArray(entry) || entry.length === 0) {
            console.log('Entrada inválida no webhook message_template_status_update');
            return;
        }

        const entryData = entry[0];
        const { changes } = entryData;

        if (!changes || !Array.isArray(changes) || changes.length === 0) {
            console.log('Mudanças não encontradas no webhook message_template_status_update');
            return;
        }

        // Em geral vem 1 por vez, mas processamos todos por segurança
        for (const change of changes) {
            if (change.field !== 'message_template_status_update') continue;

            const statusData = change.value;
            if (!statusData) {
                console.log('Dados de status do template não encontrados');
                continue;
            }

            const {
                event,
                message_template_id,
                message_template_name,
                message_template_language,
                reason
            } = statusData;

            // Converter message_template_id para string
            const templateId = message_template_id != null ? String(message_template_id) : null;

            if (event === "PENDING_DELETION") {
                await TemplateWhatsappBusiness.deleteOne({
                    templateId: templateId
                });
            } else {
                // alterar o status do template no banco de dados
                await TemplateWhatsappBusiness.updateOne({
                    templateId: templateId
                }, {
                    status: event
                });
            }

            await addLogs('message_template_status_update', {
                session,
                clienteId,
                templateId: templateId,
                templateName: message_template_name,
                templateLanguage: message_template_language,
                statusEvent: event,
                reason: reason || null,
                timestamp: new Date().toISOString()
            });


        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao processar message_template_status_update:', error);

        await addLogs('message_template_status_update_error', {
            session,
            clienteId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Processa os statuses de mensagens e salva os dados de pricing
 * @param {Array} statuses - Array de statuses do webhook
 * @param {Object} metadata - Metadata do webhook (contém phone_number_id)
 * @param {string} session - Sessão do cliente
 * @param {string} clienteId - ID do cliente
 */
const processPricingStatuses = async (statuses, metadata, session, clienteId) => {
    try {
        if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
            return;
        }

        // Buscar o canal pelo phone_number_id para obter o canal_id
        const phoneNumberId = metadata?.phone_number_id;
        if (!phoneNumberId) {
            console.log('phone_number_id não encontrado no metadata');
            return;
        }

        const canal = await Canais.findOne({
            "config.meta.whatsappBusinness.fromNumberId": phoneNumberId
        }).lean();

        if (!canal) {
            console.log(`Canal não encontrado para phone_number_id: ${phoneNumberId}`);
            return;
        }

        const canalId = canal._id;

        // Mapeamento de status
        const statusMap = {
            'failed': -1,
            'sent': 1,
            'delivered': 2,
            'read': 3
        };

        // Processar cada status
        for (const status of statuses) {
            const { pricing, timestamp, id, status: messageStatus } = status;

            // Atualizar status da mensagem no banco de dados
            if (messageStatus && statusMap.hasOwnProperty(messageStatus)) {
                const ack = statusMap[messageStatus];

                const updateData = { ack: ack };

                // Se a mensagem falhou, capturar o código e motivo do erro
                if (messageStatus === 'failed' && status.errors && Array.isArray(status.errors) && status.errors.length > 0) {
                    const errorInfo = status.errors[0];
                    const errorCode = errorInfo.code;
                    updateData.errorMessage = {
                        code: errorCode,
                        message: getWhatsappErrorMessage(errorCode)
                    };
                    console.log(`Mensagem ${id} falhou - Código: ${errorCode} - Motivo: ${updateData.errorMessage.message}`);
                }

                await WhatsappMensagens.updateOne(
                    { id: id },
                    { $set: updateData }
                );
                console.log(`Mensagem ${id} atualizada com ack: ${ack} (${messageStatus})`);
            }

            if (!pricing) {
                console.log('Pricing não encontrado no status');
                continue;
            }

            // Criar registro no modelo PricingEventsWhatsapp
            const pricingEvent = new PricingEventsWhatsapp({
                cliente_id: clienteId,
                status_message: messageStatus || null,
                message_id: id || null,
                canal_id: canalId,
                date: timestamp ? new Date(parseInt(timestamp) * 1000) : new Date(),
                session: session,
                price_category: pricing.category || null,
                price_type: pricing.type || null,
                price_precing_model: pricing.pricing_model || null,
                timestamp: timestamp ? parseInt(timestamp) : null
            });

            await pricingEvent.save();

            console.log(`Pricing event salvo: ${pricing.category} - ${pricing.type} - ${pricing.pricing_model}`);
        }

    } catch (error) {
        console.error('Erro ao processar pricing statuses:', error);
        await addLogs('pricing_statuses_error', {
            session,
            clienteId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Processa webhooks do WhatsApp Business API
 * @param {Object} webhookData - Dados do webhook
 * @param {string} session - Sessão do cliente
 * @param {string} clienteId - ID do cliente
 */
const processWboWebhook = async (webhookData, session, clienteId) => {
    try {

        const { entry } = webhookData;

        if (!entry || !Array.isArray(entry) || entry.length === 0) {
            console.log('Entrada inválida no webhook WhatsApp Business');
            return;
        }

        const entryData = entry[0];
        const { changes } = entryData;

        if (!changes || !Array.isArray(changes) || changes.length === 0) {
            console.log('Mudanças não encontradas no webhook WhatsApp Business');
            return;
        }

        // Processar cada mudança
        for (const change of changes) {
            switch (change.field) {
                case 'template_category_update':
                    await processTemplateCategoryUpdate(webhookData, session, clienteId);
                    break;

                case 'messages':
                    // Processar statuses de mensagens (pricing events)
                    if (change.value.statuses && Array.isArray(change.value.statuses) && change.value.statuses.length > 0) {
                        await processPricingStatuses(
                            change.value.statuses,
                            change.value.metadata,
                            session,
                            clienteId
                        );
                    }

                    // Processar mensagens (já existe lógica para isso)
                    // Verificar se existem mensagens e contatos
                    if (!change.value.messages || !Array.isArray(change.value.messages) || change.value.messages.length === 0) {
                        break;
                    }

                    if (!change.value.contacts || !Array.isArray(change.value.contacts) || change.value.contacts.length === 0) {
                        console.log('Nenhum contato encontrado no webhook');
                        break;
                    }

                    if (!change.value.metadata) {
                        console.log('Metadata não encontrada no webhook');
                        break;
                    }

                    const messageTransform = await transformMessageWbo({
                        messageItem: change.value.messages[0],
                        contact: change.value.contacts[0],
                        clienteId: clienteId,
                        metadata: change.value.metadata,
                        isMe: false,
                        session: session,
                        platform: 'whatsapp_business',
                        phoneNumberClientDisplay: change.value.metadata.display_phone_number
                    });

                    processWebhookWhatsapp(messageTransform, session);
                    break;

                case 'message_template_status_update':
                    await processTemplateStatusUpdate(webhookData, session, clienteId);
                    break;

                default:
                    console.log(`Campo não reconhecido: ${change.field}`);
                    break;
            }
        }

    } catch (error) {
        console.error('Erro ao processar webhook WhatsApp Business:', error);

        await addLogs('whatsapp_business_webhook_error', {
            session,
            clienteId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = {
    processTemplateCategoryUpdate,
    processTemplateStatusUpdate,
    processWboWebhook
};
