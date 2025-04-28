// Tipos de validação
export type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validate?: (value: any) => boolean | string;
  equalTo?: string;
};

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule;
};

export type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

// Mensagens de erro
const errorMessages = {
  required: 'Este campo é obrigatório',
  minLength: (min: number) => `Este campo deve ter pelo menos ${min} caracteres`,
  maxLength: (max: number) => `Este campo deve ter no máximo ${max} caracteres`,
  min: (min: number) => `O valor mínimo é ${min}`,
  max: (max: number) => `O valor máximo é ${max}`,
  pattern: 'Formato inválido',
  email: 'Email inválido',
  cpf: 'CPF inválido',
  cnpj: 'CNPJ inválido',
  phone: 'Telefone inválido',
  postalCode: 'CEP inválido',
  equalTo: 'Os valores não coincidem',
};

// Padrões comuns
const patterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  phone: /^\(\d{2}\) \d{4,5}-\d{4}$/,
  postalCode: /^\d{5}-\d{3}$/,
};

/**
 * Validador de formulários
 */
export class FormValidator<T extends Record<string, any>> {
  private rules: ValidationRules<T>;
  private customMessages: Partial<Record<keyof T, string>> = {};

  constructor(rules: ValidationRules<T>) {
    this.rules = rules;
  }

  /**
   * Define mensagens de erro personalizadas para campos específicos
   */
  setMessages(messages: Partial<Record<keyof T, string>>) {
    this.customMessages = messages;
    return this;
  }

  /**
   * Valida os dados de acordo com as regras definidas
   */
  validate(data: T): ValidationErrors<T> {
    const errors: ValidationErrors<T> = {};

    // Validar cada campo com base nas regras
    for (const field in this.rules) {
      if (Object.prototype.hasOwnProperty.call(this.rules, field)) {
        const value = data[field];
        const rules = this.rules[field as keyof T];

        if (!rules) continue;

        // Campo obrigatório
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors[field as keyof T] = this.customMessages[field as keyof T] || errorMessages.required;
          continue; // Pular outras validações se o campo for obrigatório e estiver vazio
        }

        // Pular validações para valores vazios não obrigatórios
        if ((value === undefined || value === null || value === '') && !rules.required) {
          continue;
        }

        // Comprimento mínimo
        if (rules.minLength !== undefined && typeof value === 'string' && value.length < rules.minLength) {
          errors[field as keyof T] = this.customMessages[field as keyof T] || errorMessages.minLength(rules.minLength);
          continue;
        }

        // Comprimento máximo
        if (rules.maxLength !== undefined && typeof value === 'string' && value.length > rules.maxLength) {
          errors[field as keyof T] = this.customMessages[field as keyof T] || errorMessages.maxLength(rules.maxLength);
          continue;
        }

        // Valor mínimo
        if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
          errors[field as keyof T] = this.customMessages[field as keyof T] || errorMessages.min(rules.min);
          continue;
        }

        // Valor máximo
        if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
          errors[field as keyof T] = this.customMessages[field as keyof T] || errorMessages.max(rules.max);
          continue;
        }

        // Padrão regex
        if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
          errors[field as keyof T] = this.customMessages[field as keyof T] || errorMessages.pattern;
          continue;
        }

        // Campos iguais
        if (rules.equalTo && value !== data[rules.equalTo as keyof T]) {
          errors[field as keyof T] = this.customMessages[field as keyof T] || errorMessages.equalTo;
          continue;
        }

        // Validação personalizada
        if (rules.validate) {
          const result = rules.validate(value);
          if (result !== true) {
            errors[field as keyof T] = typeof result === 'string' 
              ? result 
              : (this.customMessages[field as keyof T] || errorMessages.pattern);
            continue;
          }
        }
      }
    }

    return errors;
  }

  /**
   * Verifica se os dados são válidos
   */
  isValid(data: T): boolean {
    const errors = this.validate(data);
    return Object.keys(errors).length === 0;
  }
}

/**
 * Helpers para validações comuns
 */
export const validators = {
  required: { required: true },
  
  email: { 
    pattern: patterns.email,
    validate: (value: string) => patterns.email.test(value) || errorMessages.email
  },
  
  cpf: { 
    pattern: patterns.cpf,
    validate: (value: string) => patterns.cpf.test(value) || errorMessages.cpf
  },
  
  cnpj: { 
    pattern: patterns.cnpj,
    validate: (value: string) => patterns.cnpj.test(value) || errorMessages.cnpj
  },
  
  phone: { 
    pattern: patterns.phone,
    validate: (value: string) => patterns.phone.test(value) || errorMessages.phone
  },
  
  postalCode: { 
    pattern: patterns.postalCode,
    validate: (value: string) => patterns.postalCode.test(value) || errorMessages.postalCode
  },
  
  minLength: (min: number): ValidationRule => ({ 
    minLength: min,
    validate: (value: string) => (value.length >= min) || errorMessages.minLength(min)
  }),
  
  maxLength: (max: number): ValidationRule => ({ 
    maxLength: max,
    validate: (value: string) => (value.length <= max) || errorMessages.maxLength(max)
  }),
  
  min: (min: number): ValidationRule => ({ 
    min,
    validate: (value: number) => (value >= min) || errorMessages.min(min)
  }),
  
  max: (max: number): ValidationRule => ({ 
    max,
    validate: (value: number) => (value <= max) || errorMessages.max(max)
  }),
  
  equalTo: (field: string): ValidationRule => ({ 
    equalTo: field,
    validate: (value: any, formData: any) => (value === formData[field]) || errorMessages.equalTo
  }),
};