import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import Home from "@/app/page";

vi.mock("@/lib/supabase/client", async () => ({
  supabase: (await import("@/test/fakeSupabase")).fakeSupabase,
}));

test("トップページに見出しが表示される", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
});
