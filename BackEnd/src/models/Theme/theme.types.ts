export interface CreateTheme {
  theme_name: string;
  theme_color: string;
  price: number;
}

export interface UpdateTheme {
  theme_name?: string;
  theme_color?: string;
  price?: number;
}
