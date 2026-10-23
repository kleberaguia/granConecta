import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
const AguardandoPagamento = () => {
    const { usuarioId } = useParams();
    const navigate = useNavigate();
    // Agora vamos realmente usar o 'status'
    const [status, setStatus] = useState('Aguardando...');

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await axios.get(`/pix-status/${usuarioId}`);

                // Atualiza o estado com o que vem do banco
                // Isso faz com que o valor seja "lido", removendo o erro
                setStatus(response.data.status);

                if (response.data.status === 'PAID' || response.data.status === 'PAGO') {
                    clearInterval(intervalo);
                    navigate('/login/prestador');
                }
            } catch (error) {
                console.error("Erro ao verificar status", error);
                setStatus('Erro ao verificar');
            }
        };

        const intervalo = setInterval(checkStatus, 5000);
        checkStatus();

        return () => clearInterval(intervalo);
    }, [usuarioId, navigate]);

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2>Aguardando confirmação do pagamento...</h2>
            {/* Exibindo o status na tela para o usuário e para o React não reclamar */}
            <p>Status atual: <strong>{status}</strong></p>
            <p>Assim que o Pix for confirmado, você será redirecionado automaticamente.</p>
        </div>
    );
};
export default AguardandoPagamento;