/**
 * Máscara para CNPJ (suporta novo formato alfanumérico)
 * Raiz: 8 posições (letras e números)
 * Filial: 4 posições (números)
 * Dígitos: 2 posições (números)
 * Exemplo: 12.ABC.345/0001-99
 */
export const formatCNPJ = (value: string): string => {
  if (!value) return '';
  
  // Remove tudo que não for letra ou número
  let v = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // O CNPJ sempre terá 14 posições no máximo
  if (v.length > 14) v = v.substring(0, 14);
  
  // Aplica máscara progressiva
  if (v.length <= 2) return v;
  if (v.length <= 5) return `${v.substring(0, 2)}.${v.substring(2)}`;
  if (v.length <= 8) return `${v.substring(0, 2)}.${v.substring(2, 5)}.${v.substring(5)}`;
  if (v.length <= 12) return `${v.substring(0, 2)}.${v.substring(2, 5)}.${v.substring(5, 8)}/${v.substring(8)}`;
  
  return `${v.substring(0, 2)}.${v.substring(2, 5)}.${v.substring(5, 8)}/${v.substring(8, 12)}-${v.substring(12, 14)}`;
};

/**
 * Máscara para CPF ou Passaporte (flexível)
 * Se tiver apenas números e até 11 dígitos, formata como CPF.
 * Caso contrário, não aplica máscara fixa (para permitir passaportes e RGs diversos).
 */
export const formatDocument = (value: string): string => {
  if (!value) return '';
  
  // Verifica se a string contém apenas números
  const isOnlyNumbers = /^\d+$/.test(value.replace(/\D/g, ''));
  
  if (isOnlyNumbers && value.replace(/\D/g, '').length <= 11) {
    // Formata como CPF: 000.000.000-00
    let v = value.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    
    if (v.length <= 3) return v;
    if (v.length <= 6) return `${v.substring(0, 3)}.${v.substring(3)}`;
    if (v.length <= 9) return `${v.substring(0, 3)}.${v.substring(3, 6)}.${v.substring(6)}`;
    
    return `${v.substring(0, 3)}.${v.substring(3, 6)}.${v.substring(6, 9)}-${v.substring(9, 11)}`;
  }
  
  // Caso contenha letras (ex: passaporte) ou seja um RG, permite até 20 caracteres sem máscara complexa
  return value.substring(0, 20).toUpperCase();
};

/**
 * Máscara para Telefones (flexível)
 * Se for telefone BR (até 11 dígitos numéricos), aplica (XX) XXXXX-XXXX
 * Se começar com '+', deixa livre para formato internacional.
 */
export const formatPhone = (value: string): string => {
  if (!value) return '';
  
  if (value.startsWith('+')) {
    // Internacional: mantém o + e permite números e espaços, até 20 caracteres
    return '+' + value.replace(/[^\d ]/g, '').substring(0, 19);
  }
  
  let v = value.replace(/\D/g, '');
  if (v.length > 11) v = v.substring(0, 11);
  
  if (v.length <= 2) return v;
  if (v.length <= 6) return `(${v.substring(0, 2)}) ${v.substring(2)}`;
  if (v.length <= 10) return `(${v.substring(0, 2)}) ${v.substring(2, 6)}-${v.substring(6)}`;
  
  return `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7, 11)}`;
};
