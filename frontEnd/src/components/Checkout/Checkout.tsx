import { useState, useEffect, useMemo } from 'react';
import {
    Container, Paper, Typography, Box, TextField, Button,
    Divider, Stack, Radio, RadioGroup, FormControlLabel,
    List,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../api/api';
import { socket } from "./socket";
import { PixPayment } from "../PixPayment/PixPayment";

// ==========================================
// FORM VISITANTE COM SENHA (CORRIGIDO)
// ==========================================
const CheckoutForm = ({ onSubmit, initialData }: { onSubmit: (data: any) => void, initialData?: any }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        email: initialData?.email || "",
        telefone: initialData?.telefone || "",
        endereco: initialData?.endereco || "",
        senha: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleConfirm = () => {
        if (!formData.name || !formData.telefone || !formData.endereco || !formData.email || !formData.senha) {
            toast.error("Preencha todos os campos, incluindo e-mail e senha para criar seu acesso.");
            return;
        }
        if (formData.senha.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres.");
            return;
        }
        onSubmit(formData);
    };

    return (
        <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Crie sua conta para continuar</Typography>
            {/* 🟢 CORREÇÃO: O 'name' do input deve bater exatamente com a chave do useState ('name') */}
            <TextField label="Nome Completo *" name="name" value={formData.name} onChange={handleChange} fullWidth />
            <TextField label="Email *" name="email" type="email" value={formData.email} onChange={handleChange} fullWidth />
            <TextField label="Telefone *" name="telefone" value={formData.telefone} onChange={handleChange} fullWidth />
            <TextField label="Endereço / Apto *" name="endereco" value={formData.endereco} onChange={handleChange} fullWidth />
            <TextField label="Crie uma Senha *" name="senha" type="password" value={formData.senha} onChange={handleChange} fullWidth />
            <Button variant="contained" onClick={handleConfirm} size="large" sx={{ mt: 1, fontWeight: 'bold' }}>
                Confirmar e Criar Conta
            </Button>
        </Box>
    );
};

// ==========================================
// CHECKOUT PRINCIPAL
// ==========================================
export const Checkout = () => {
    const { user, cart, clearCart } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const serviceData = location.state?.serviceInfo;
    const isService = !!serviceData;
    const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);
    const [deliveryConfig, setDeliveryConfig] = useState<any>(null);
    const [paymentConfig, setPaymentConfig] = useState<any>(null);
    const [visitorData, setVisitorData] = useState<any>(null);
    const [userType, setUserType] = useState<'condominio_fora' | 'visitante' | null>(null);
    const [showSelection, setShowSelection] = useState(true);
    const [_listaCondominios, setListaCondominios] = useState<any[]>([]);
    const [pagamento, setPagamento] = useState('pix');
    const [loading, setLoading] = useState(false);
    const [showPixModal, setShowPixModal] = useState(false);
    const [orderData, setOrderData] = useState<any>(null);

    const items = useMemo(() => {
        const cartEntries = Object.entries(cart || {});

        return cartEntries.flatMap(([storeId, items]) =>
            (items || []).map(item => ({
                productId: item.id,
                name: item.name,
                image: item.image,
                quantity: item.quantity,
                price: item.price,
                storeId
            }))
        );
    }, [cart]);

    const storeId = items[0]?.storeId || serviceData?.lojaId || serviceData?.prestadorId;
    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const frete = (deliveryConfig?.acceptDelivery && !isService) ? Number(deliveryConfig.deliveryFee) : 0;
    const total = subtotal + frete;

    useEffect(() => {
        if (!storeId) return;
        
        const loadData = async () => {
            try {
                const [payRes, delRes, condRes] = await Promise.allSettled([
                    api.get(`/lojas/${storeId}/payment-config`).catch(() => 
                        api.get(`/stores/${storeId}/payment-config`)
                    ),
                    api.get(`/lojas/delivery-config/${storeId}`),
                    api.get('/condominios')
                ]);

                if (payRes.status === 'fulfilled') {
                    setPaymentConfig(payRes.value.data);
                } else {
                    console.warn("⚠️ Não foi possível carregar a configuração de pagamento da loja.");
                    setPaymentConfig({ pix_enabled: true, cash_enabled: true });
                }

                if (delRes.status === 'fulfilled') {
                    setDeliveryConfig(delRes.value.data);
                }

                if (condRes.status === 'fulfilled') {
                    setListaCondominios(condRes.value.data || []);
                }

            } catch (err) { 
                console.error("Erro crítico no lote de requisições:", err); 
            }
        };
        
        loadData();
    }, [storeId]);

    useEffect(() => {
        const token = localStorage.getItem('@App:user') || localStorage.getItem('token');

        if (token && !user) {
            const timer = setTimeout(() => {
                setIsVerifyingAuth(false);
            }, 300);
            return () => clearTimeout(timer);
        }

        setIsVerifyingAuth(false);
    }, [user]);

    useEffect(() => {
        const oId = orderData?.order?.id || orderData?.id;
        if (!oId) return;

        socket.emit("join_order", oId);
        
        const handler = (data: any) => {
            if (data.orderId === oId && data.status === "PAID") {
                toast.success("Pagamento aprovado com sucesso!");
                clearCart();
                navigate("/pedido-confirmado", {
                    state: { orderId: oId, paymentType: pagamento }
                });
            }
        };

        socket.on("order_updated", handler);
        return () => { socket.off("order_updated", handler); };
    }, [orderData, pagamento, clearCart, navigate]);

    const handleFinalizeOrder = async () => {
        setLoading(true);
        try {
            let customerInfoPayload = null;

            if (!user && visitorData) {
                customerInfoPayload = {
                    nome: visitorData.name, // Ajustado para bater com 'customer_info.nome' do back-end
                    email: visitorData.email,
                    telefone: visitorData.telefone,
                    endereco: visitorData.endereco,
                    senha: visitorData.senha,
                    userType: userType,
                    condominio_id: serviceData?.condominio_id || null,
                    bairro: "Externo / Visitante",
                    cidade: "São Paulo",
                    uf: "SP",
                    numero: "S/N"
                };
            }
            
            const payload = {
                store_id: storeId,
                payment_method: pagamento,
                usuarioId: user?.id || null,
                is_service: isService,
                service_details: serviceData,
                customer_info: customerInfoPayload,
                items: isService ? [] : items,
                totalAmount: isService ? 0 : total
            };

            const res = await api.post('/order/orders', payload);

            if (pagamento === 'pix' && !isService) {
                setOrderData(res.data);
                setShowPixModal(true);
            } else {
                toast.success(isService ? "Solicitação de serviço enviada!" : "Pedido realizado!");
                clearCart();

                if (isService) {
                    const slugParaRedirecionar = serviceData.slug || serviceData.categoryTag || "servico";
                    navigate(`/servico-enviado/${slugParaRedirecionar}`, {
                        state: {
                            prestadorNome: serviceData.prestadorNome,
                            protocolo: res.data.id
                        }
                    });
                } else {
                    navigate('/pedido-confirmado', { state: { orderId: res.data.id } });
                }
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.error || "Erro ao processar. Verifique os dados.");
        } finally { setLoading(false); }
    };

    const handleClosePix = () => {
        setShowPixModal(false);
        const finalId = orderData?.order?.id || orderData?.id;
        navigate("/pedido-confirmado", {
            state: {
                orderId: finalId,
                paymentType: "pix",
                deliveryCode: orderData?.order?.deliveryCode || orderData?.deliveryCode
            }
        });
    };

    if (isVerifyingAuth) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Typography>Carregando dados da sessão...</Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Grid container spacing={4}>
                {/* COLUNA ESQUERDA: IDENTIFICAÇÃO */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper sx={{ p: 3, minHeight: 450, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        {(user || visitorData) ? (
                            <Stack spacing={3}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Identificação Confirmada</Typography>
                                <Box bgcolor="#f8fafc" p={2} borderRadius={2} border="1px solid #e2e8f0">
                                    <Typography sx={{ mb: 0.5 }}><strong>Nome:</strong> {user?.name || visitorData?.name}</Typography>
                                    <Typography sx={{ mb: 0.5 }}><strong>E-mail:</strong> {user?.email || visitorData?.email}</Typography>
                                    <Typography><strong>Local:</strong> {user ? "Meu Condomínio" : visitorData?.endereco}</Typography>
                                </Box>
                                <Divider />
                               
                                <Typography variant="subtitle1" fontWeight="bold">Forma de Pagamento</Typography>
                                <RadioGroup value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
                                    {(paymentConfig?.pix_enabled || paymentConfig?.mercado_pago_enabled) && (
                                        <FormControlLabel value="pix" control={<Radio />} label="PIX (Imediato)" />
                                    )}
                                    {paymentConfig?.cash_enabled && (
                                        <FormControlLabel value="dinheiro" control={<Radio />} label="Pagamento na Entrega / Local" />
                                    )}
                                </RadioGroup>
                                <Button 
                                    variant="text" 
                                    color="error" 
                                    onClick={() => { setVisitorData(null); setShowSelection(true); setUserType(null); }}
                                    sx={{ alignSelf: 'flex-start', mt: 2 }}
                                >
                                    Trocar Usuário / Sair
                                </Button>
                            </Stack>
                        ) : (
                            <Box>
                                {showSelection ? (
                                    <Stack spacing={2} sx={{ mt: 4 }}>
                                        <Typography variant="h5" fontWeight="bold" textAlign="center">Para continuar, identifique-se</Typography>
                                        <Button variant="contained" size="large" onClick={() => navigate('/login/morador')} sx={{ py: 1.5, fontWeight: 'bold' }}>
                                            Sou Morador
                                        </Button>
                                        <Button variant="outlined" size="large" onClick={() => setShowSelection(false)} sx={{ py: 1.5, fontWeight: 'bold' }}>
                                            Não moro aqui / Visitante
                                        </Button>
                                    </Stack>
                                ) : !userType ? (
                                    <Stack spacing={2} sx={{ mt: 4 }}>
                                        <Typography variant="h6" textAlign="center" fontWeight="bold">Você é de outro condomínio?</Typography>
                                        <Button variant="outlined" size="large" onClick={() => setUserType('condominio_fora')} sx={{ py: 1.5 }}>
                                            Sim, de outro condomínio parceiro
                                        </Button>
                                        <Button variant="outlined" size="large" onClick={() => setUserType('visitante')} sx={{ py: 1.5 }}>
                                            Não, sou visitante de fora
                                        </Button>
                                        <Button variant="text" size="small" onClick={() => setShowSelection(true)} sx={{ mt: 1 }}>
                                            Voltar
                                        </Button>
                                    </Stack>
                                ) : (
                                    <Box>
                                        <CheckoutForm onSubmit={setVisitorData} initialData={userType === 'condominio_fora' ? { endereco: visitorData?.condominio_origem } : {}} />
                                        <Button variant="text" size="small" onClick={() => { setUserType(null); }} sx={{ mt: 2 }}>
                                            Voltar Etapa
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* COLUNA DIREITA: RESUMO DINÂMICO */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper sx={{ p: 3, borderTop: '4px solid #1e293b', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            {isService ? "Resumo da Solicitação" : "Resumo da Compra"}
                        </Typography>

                        {isService ? (
                            <Box sx={{ mt: 2, p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                                <Typography variant="subtitle2" color="primary" fontWeight="bold">SERVIÇO:</Typography>
                                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    {serviceData.titulo}
                                </Typography>

                                <Typography variant="subtitle2" color="primary" fontWeight="bold">DETALHES:</Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                                    {serviceData.descricao || "Sem detalhes adicionais."}
                                </Typography>

                                {serviceData.categoriaNome && (
                                    <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.disabled' }}>
                                        Categoria: {serviceData.categoriaNome}
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            <>
                                <List disablePadding>
                                    {items.map(item => (
                                        <Box key={item.productId} display="flex" justifyContent="space-between" py={1.5} borderBottom="1px dashed #e2e8f0">
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                <strong>{item.quantity}x</strong> {item.name}
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                R$ {(Number(item.price) * item.quantity).toFixed(2)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </List>
                                <Divider sx={{ my: 2 }} />
                                <Stack spacing={1.5}>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography color="text.secondary">Subtotal</Typography>
                                        <Typography fontWeight="medium">R$ {subtotal.toFixed(2)}</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography color="text.secondary">Entrega</Typography>
                                        <Typography color={frete === 0 ? "success.main" : "text.primary"} fontWeight="medium">
                                            {frete === 0 ? "Grátis" : `R$ ${frete.toFixed(2)}`}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between" pt={1}>
                                        <Typography fontWeight="bold">Total</Typography>
                                        <Typography fontWeight="bold" color="primary" variant="h6">
                                            R$ {total.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </>
                        )}

                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{ mt: 4, py: 1.8, fontWeight: 'bold', borderRadius: 2 }}
                            onClick={handleFinalizeOrder}
                            disabled={loading || (!isService && items.length === 0) || (!user && !visitorData)}
                        >
                            {loading ? "Processando..." : isService ? "Enviar Solicitação" : "Finalizar Pedido"}
                        </Button>

                        {isService && (
                            <Typography variant="caption" sx={{ mt: 2, display: 'block', textAlign: 'center', color: 'text.secondary' }}>
                                * O prestador analisará sua solicitação e entrará em contato.
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* MODAL PIX */}
            <Dialog open={showPixModal} onClose={handleClosePix} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center', pt: 3 }}>
                    Pagamento via PIX
                </DialogTitle>
                <DialogContent>
                    {/* 🟢 O payload do paymentData lê a resposta estruturada com o Mercado Pago */}
                    <PixPayment
                        paymentData={orderData?.payment || orderData}
                        amount={Number(orderData?.totalAmount || total)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={handleClosePix} variant="contained" fullWidth size="large" sx={{ fontWeight: 'bold', py: 1.2 }}>
                        Já paguei / Concluir
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};