export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateEventCreation(data: {
  title: string;
  description: string;
  category: string;
  startTime: string;
  endTime: string;
  wagerAmount: string;
  maxParticipants: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Title validation
  if (!data.title.trim()) {
    errors.title = 'Title is required';
  } else if (data.title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  } else if (data.title.length > 100) {
    errors.title = 'Title must be less than 100 characters';
  }

  // Time validation
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  const now = new Date();

  if (start < now) {
    errors.startTime = 'Start time must be in the future';
  }
  
  if (end <= start) {
    errors.endTime = 'End time must be after start time';
  }

  // Wager amount validation
  const wagerAmount = parseInt(data.wagerAmount);
  if (isNaN(wagerAmount) || wagerAmount <= 0) {
    errors.wagerAmount = 'Wager amount must be greater than 0';
  }

  // Participants validation
  const maxParticipants = parseInt(data.maxParticipants);
  if (isNaN(maxParticipants) || maxParticipants < 2) {
    errors.maxParticipants = 'Minimum 2 participants required';
  } else if (maxParticipants > 100) {
    errors.maxParticipants = 'Maximum 100 participants allowed';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateEventRules(rules: string[]): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!rules.length) {
    errors.rules = 'At least one rule is required';
  }

  rules.forEach((rule, index) => {
    if (!rule.trim()) {
      errors[`rule_${index}`] = 'Rule cannot be empty';
    }
    if (rule.length > 200) {
      errors[`rule_${index}`] = 'Rule must be less than 200 characters';
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}