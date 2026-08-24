import {
  CircleUserRound,
  Palette,
  Warehouse,
  ToolCase,
  ReceiptText,
  Bell,
  Unplug,
  Import,
  CreditCard,
  UserRound,
  UsersRound,
  Wrench,
  Zap,
  ThermometerSnowflake,
  BrushCleaning,
  TreeDeciduous,
  Construction,
} from 'lucide-react';

/**
 * Icon name → glyph, shared by the settings nav, the dispatch model cards and
 * the industry chips so the data store can stay free of React imports.
 */
export const settingsIcons = {
  'circle-user-round': CircleUserRound,
  palette: Palette,
  warehouse: Warehouse,
  'tool-case': ToolCase,
  'receipt-text': ReceiptText,
  bell: Bell,
  unplug: Unplug,
  import: Import,
  'credit-card': CreditCard,
  'user-round': UserRound,
  'users-round': UsersRound,
  wrench: Wrench,
  zap: Zap,
  'thermometer-snowflake': ThermometerSnowflake,
  'brush-cleaning': BrushCleaning,
  'tree-deciduous': TreeDeciduous,
  construction: Construction,
};
