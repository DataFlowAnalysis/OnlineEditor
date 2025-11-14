export class SettingsValue<T> {
  private value: T;
  private listeners: Array<(newValue: T) => void> = [];
  
  constructor(initialValue: T) {
    this.value = initialValue;
  }

  get(): T {
    return this.value;
  }

  set(newValue: T): void {
    this.value = newValue;
    this.listeners.forEach(listener => listener(newValue));
  }

  registerListener(listener: (newValue: T) => void): void {
    this.listeners.push(listener);
  }

}

export class BoolSettingsValue extends SettingsValue<boolean> {
  constructor(initialValue: boolean = false) {
    super(initialValue);
  }
}