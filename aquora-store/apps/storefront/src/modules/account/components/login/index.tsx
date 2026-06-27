import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  return (
    <div className="w-full" data-testid="login-page">
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
        Welcome back
      </span>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-aquora-ink">Sign in</h1>
      <p className="mt-2 mb-8 text-aquora-muted">
        Access your orders, addresses and a faster checkout.
      </p>
      {message?.state === "verification_required" && (
        <div
          className="w-full mb-6 text-base-regular text-aquora-ink bg-aquora-surface border border-black/[0.06] rounded-2xl p-4"
          data-testid="login-verification-message"
        >
          We sent a verification link to <strong>{message.email}</strong>.
          Please verify your email, then sign in.
        </div>
      )}
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="login-error-message"
        />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
          Sign in
        </SubmitButton>
      </form>
      <span className="mt-6 block text-sm text-aquora-muted">
        Not a member?{" "}
        <button
          type="button"
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="font-semibold text-aquora-primary hover:underline"
          data-testid="register-button"
        >
          Join us
        </button>
      </span>
    </div>
  )
}

export default Login
