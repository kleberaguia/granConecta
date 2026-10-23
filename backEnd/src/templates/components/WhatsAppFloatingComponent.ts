export const WhatsAppFloatingComponent = (
  telefone?: string,
  mensagem: string = "Olá! Gostaria de mais informações."
) => {

  const safeTelefone =
    typeof telefone === "string"
      ? telefone
      : "";

  if (!safeTelefone) return "";

  const telLimpo = safeTelefone.replace(/\D/g, "");

  if (!telLimpo) return "";

  const msgEncoded = encodeURIComponent(mensagem);

  return `
    <a href="https://wa.me/${telLimpo}?text=${msgEncoded}" 
       target="_blank" 
       aria-label="Falar no WhatsApp"
       class="fixed bottom-8 right-8 w-14 h-14 bg-green-500 text-white rounded-full 
              flex items-center justify-center shadow-lg z-50 transition transform 
              hover:scale-110 hover:bg-green-700 animate-pulse">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217s.231.006.332.013c.101.007.237-.038.37.289.133.327.457 1.114.495 1.192.039.078.065.168.013.272s-.078.121-.156.212c-.078.09-.163.2-.234.281-.081.093-.166.193-.072.355.095.161.423.697.908 1.129.623.556 1.149.728 1.311.809.161.081.256.067.35-.042.095-.11 0 .405-.243.64l-.32.32c-.084.081-.169.176-.041.356.129.179.572.943.123 1.836z"/>
      </svg>
      <span class="absolute top-1 right-1 w-3 h-3 bg-green-600 border-2 border-white rounded-full"></span>
    </a>
  `;
};