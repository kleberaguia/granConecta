import React, { useState } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Layout, CheckCircle, Clock, CreditCard } from 'lucide-react';

const PLANOS = [
    { id: 'bronze', nome: '7 Dias', dias: 7, preco: '29,90' },
    { id: 'prata', nome: '15 Dias', dias: 15, preco: '49,90' },
    { id: 'ouro', nome: '30 Dias', dias: 30, preco: '89,90' },
];

interface CriarBannerProps {
    onSuccess?: () => void; // A interrogação torna opcional
}

export default function CriarBanner({ onSuccess }: CriarBannerProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Cria uma mini visualização da imagem
        }
    };

    const [formData, setFormData] = useState({
        titulo: '',
        subtitulo: '',
        imagem_url: '',
        cor_destaque: '#3b82f6',
        plano: 'bronze'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return alert("Por favor, selecione uma imagem.");

        setLoading(true);


        

        // Precisamos usar FormData para enviar arquivos
        const formDataToSend = new FormData();
        formDataToSend.append('image', selectedFile); // O arquivo
        formDataToSend.append('titulo', formData.titulo);
        formDataToSend.append('subtitulo', formData.subtitulo);
        formDataToSend.append('plano', formData.plano);
        formDataToSend.append('loja_id', user?.lojaId || '');
        formDataToSend.append('condominio_id', String(user?.condominio_id || ''));

        try {
            // Rota de upload no seu backend
            await api.post('/marketplace/banners/solicitar', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSucesso(true);
            if (onSuccess) onSuccess();
        } catch (err) {
            alert("Erro ao enviar imagem.");
        } finally {
            setLoading(false);
        }
    };

    if (sucesso) {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <CheckCircle size={60} color="#22c55e" />
                    <h2>Solicitação Enviada!</h2>
                    <p>Agora realize o pagamento para ativar seu banner.</p>
                    <div style={pixBoxStyle}>
                        <strong>Chave PIX (CNPJ):</strong><br />
                        00.000.000/0001-00
                    </div>
                    <button onClick={() => setSucesso(false)} style={btnStyle}>Voltar</button>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <form onSubmit={handleSubmit} style={formStyle}>
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Layout /> Anunciar no Marketplace
                    </h2>
                    <p style={{ color: '#64748b' }}>Apareça no topo para todos os moradores.</p>
                </div>

                <label style={labelStyle}>Título do Anúncio</label>
                <input
                    style={inputStyle}
                    placeholder="Ex: Pizzaria do Bairro - 20% OFF"
                    required
                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                />

                <label style={labelStyle}>Subtítulo (Chamada de ação)</label>
                <textarea
                    style={{ ...inputStyle, height: '80px' }}
                    placeholder="Ex: As melhores massas artesanais agora no seu condomínio."
                    onChange={e => setFormData({ ...formData, subtitulo: e.target.value })}
                />

                <label style={labelStyle}>URL da Imagem (1200x400px)</label>
                <div style={uploadContainerStyle}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        id="banner-upload"
                    />
                    <label htmlFor="banner-upload" style={uploadBtnStyle}>
                        {selectedFile ? "Trocar Imagem" : "Selecionar Imagem do Computador"}
                    </label>

                    {previewUrl && (
                        <img src={previewUrl} alt="Preview" style={previewImageStyle} />
                    )}
                </div>

                <label style={labelStyle}>Selecione o Plano</label>
                <div style={planoGridStyle}>
                    {PLANOS.map(p => (
                        <div
                            key={p.id}
                            onClick={() => setFormData({ ...formData, plano: p.id })}
                            style={{
                                ...planoCardStyle,
                                borderColor: formData.plano === p.id ? '#3b82f6' : '#e2e8f0',
                                backgroundColor: formData.plano === p.id ? '#eff6ff' : '#fff'
                            }}
                        >
                            <Clock size={16} />
                            <strong>{p.nome}</strong>
                            <span>R$ {p.preco}</span>
                        </div>
                    ))}
                </div>

                <button type="submit" disabled={loading} style={btnStyle}>
                    {loading ? 'Enviando...' : <><CreditCard size={18} /> Confirmar Solicitação</>}
                </button>
            </form>
        </div>
    );
}

// --- ESTILOS (Objeto que resolve o erro de Cannot find name) ---

const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 20px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
};

const formStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column'
};

const cardStyle: React.CSSProperties = {
    textAlign: 'center',
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none'
};

const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '5px',
    color: '#475569'
};

const planoGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '10px',
    marginBottom: '25px'
};

const planoCardStyle: React.CSSProperties = {
    border: '2px solid',
    borderRadius: '10px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    transition: '0.2s',
    fontSize: '12px'
};

const btnStyle: React.CSSProperties = {
    padding: '14px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
};

const pixBoxStyle: React.CSSProperties = {
    backgroundColor: '#f1f5f9',
    padding: '15px',
    borderRadius: '8px',
    width: '100%',
    fontSize: '14px',
    border: '1px dashed #cbd5e1'
};

const uploadContainerStyle: React.CSSProperties = {
    border: '2px dashed #e2e8f0',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    marginBottom: '15px'
};

const uploadBtnStyle: React.CSSProperties = {
    backgroundColor: '#f1f5f9',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'inline-block',
    fontWeight: 600,
    fontSize: '14px',
    border: '1px solid #cbd5e1'
};

const previewImageStyle: React.CSSProperties = {
    marginTop: '15px',
    width: '100%',
    maxHeight: '150px',
    objectFit: 'cover',
    borderRadius: '8px'
}