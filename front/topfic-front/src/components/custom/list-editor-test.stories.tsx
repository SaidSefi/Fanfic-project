import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListEditorTest } from "./list-editor-test";

const meta: Meta<typeof ListEditorTest> = {
  title: "Custom/ListEditorTest",
  component: ListEditorTest,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ListEditorTest>;

export const Default: Story = {
  name: "Full test — drag & drop",
};
