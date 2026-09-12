import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
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
    await expect(canvas.getByLabelText('Left coach')).toHaveValue('Alice');
    await expect(canvas.getByLabelText('Right coach')).toHaveValue('Bob');
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

export const PregameCheckingInFirstPlayer: Story = {
  args: { scenario: 'pregame-empty' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^Maya. Press to mark here/i }));
    await expect(canvas.getByRole('button', { name: /Maya is here/i })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText('7 more for two full fields')).toBeVisible();
  },
};

export const PregameReadyWithExpectedNotes: Story = {
  args: { scenario: 'pregame-ready' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('First 8 are marked to start')).toBeVisible();
    await expect(canvas.getByText('30 mins late')).toBeVisible();
    await expect(canvas.getByText('gone')).toBeVisible();
  },
};

export const PregameConfirmingUnmark: Story = {
  args: { scenario: 'pregame-ready' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const owen = canvas.getByRole('button', { name: /Owen is here/i });
    await userEvent.click(owen);
    await expect(canvas.getByRole('button', { name: /Owen is here. Press again to confirm unmark/i })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(canvas.getByRole('button', { name: /Owen is here. Press again to confirm unmark/i }));
    await expect(canvas.getByRole('button', { name: /^Owen. Press to mark here/i })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(canvas.getByRole('button', { name: /^Owen. Press to mark here/i }));
    await userEvent.click(canvas.getByRole('button', { name: /Owen is here/i }));
    await expect(canvas.getByRole('button', { name: /Owen is here. Press again to confirm unmark/i })).toBeVisible();
  },
};

export const PregameAddingExpectedNote: Story = {
  args: { scenario: 'pregame-ready' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ezra = canvas.getByRole('button', { name: /^Ezra. Press to mark here/i });
    await fireEvent.pointerDown(ezra, { pointerId: 2 });
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    await fireEvent.pointerUp(ezra, { pointerId: 2 });
    const note = canvas.getByRole('textbox', { name: 'Expected note for Ezra' });
    await userEvent.type(note, '30 mins late');
    await expect(note).toHaveValue('30 mins late');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    const expectedEzra = canvas.getByRole('button', { name: /Ezra, expected 30 mins late/i });
    await expect(expectedEzra).toBeVisible();
    await fireEvent.pointerDown(expectedEzra, { pointerId: 3 });
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    await fireEvent.pointerUp(expectedEzra, { pointerId: 3 });
    await expect(canvas.getByRole('textbox', { name: 'Expected note for Ezra' })).toHaveValue('30 mins late');
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
    const leftCoach = canvas.getByRole('button', { name: /Alice, left coach/i });
    await fireEvent.pointerDown(leftCoach, { pointerId: 1, clientX: 40 });
    await fireEvent.pointerMove(leftCoach, { pointerId: 1, clientX: 100 });
    await fireEvent.pointerUp(leftCoach, { pointerId: 1, clientX: 100 });
    await expect(canvas.getByTestId('left-field')).toHaveTextContent('Bob');
    await userEvent.click(canvas.getByRole('button', { name: /Bob, left coach/i }));
    await expect(canvas.getByTestId('left-field')).toHaveTextContent('Alice');
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
