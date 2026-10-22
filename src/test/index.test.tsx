import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Index from "@/pages/Index";

const signOut = vi.fn();

// The workspace only needs an identity to render. Stubbing the context keeps
// Google Identity Services out of jsdom, where it cannot load.
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    status: "signed-in",
    user: { sub: "test-sub", email: "qa@example.com", name: "QA Tester", picture: "" },
    error: null,
    renderSignInButton: vi.fn(),
    signOut,
  }),
}));

describe("Index page", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ runs: [], documents: [] }),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    signOut.mockReset();
  });

  it("renders the test case generator workspace", async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("AI Powered Testing Agent")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "New analysis" })).toBeInTheDocument();
    expect(screen.getByText(/Source document/)).toBeInTheDocument();
    expect(screen.getByText("Attach a PRD")).toBeInTheDocument();
    expect(screen.getByText("Supporting context")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate coverage" })).toBeDisabled();
  });

  it("shows the signed-in user and a working sign-out control", async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("QA Tester")).toBeInTheDocument();
    });

    screen.getByRole("button", { name: "Sign out" }).click();
    expect(signOut).toHaveBeenCalledOnce();
  });
});
