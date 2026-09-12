import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { NextKidApp } from './NextKidApp';

const meta = {
  title: 'NextKid/Mobile flow',
  component: NextKidApp,
  parameters: { layout: 'fullscreen' },
  args: { scenario: 'game-running' },
} satisfies Meta<typeof NextKidApp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Welcome: Story = {
  args: { scenario: 'welcome' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /new game/i })).toBeVisible();
  },
};

export const NewGame: Story = {
  args: { scenario: 'new-game' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /begin pregame/i }));
    await expect(canvas.getByRole('status')).toHaveTextContent(/game link ready/i);
  },
};

export const PregameNoArrivals: Story = {
  args: { scenario: 'pregame-empty' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('8 more for two full fields')).toBeVisible();
    await expect(canvas.getByRole('button', { name: /go to game/i })).toBeDisabled();
  },
};

export const PregameReadyWithLateAndAbsent: Story = {
  args: { scenario: 'pregame-ready' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('First 8 are marked to start')).toBeVisible();
    await expect(canvas.getAllByText('LATE')[0]).toBeVisible();
    await expect(canvas.getAllByText('OUT')[0]).toBeVisible();
  },
};

export const GameRunningTypical15Players: Story = {
  args: { scenario: 'game-running' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Alice')).toBeVisible();
    await expect(canvas.getByText('Bob')).toBeVisible();
    await expect(canvas.getByText('Bench')).toBeVisible();
    await expect(canvas.getAllByRole('button', { name: /playing time|field time|bench time/i })).toHaveLength(15);
    await userEvent.click(canvas.getByRole('button', { name: /^STOP$/i }));
    await expect(canvas.getByText('PAUSED')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /^START$/i }));
    await expect(canvas.getByText('RUNNING')).toBeVisible();
    (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
  },
};

export const GamePaused: Story = {
  args: { scenario: 'game-paused' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('PAUSED')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /^START$/i }));
    await expect(canvas.getByText('RUNNING')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /^STOP$/i }));
    await expect(canvas.getByText('PAUSED')).toBeVisible();
    (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
  },
};

export const GameNearlyEven: Story = {
  args: { scenario: 'game-balanced' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('button', { name: /playing time near even/i }).length).toBeGreaterThan(8);
  },
};
