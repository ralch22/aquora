import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="flex items-center justify-between gap-4 bg-white">
      <div>
        <Heading level="h2" className="txt-xlarge">
          Already have an account?
        </Heading>
        <Text className="txt-medium text-aquora-muted mt-2">
          Sign in for a faster checkout and to track your orders — or just
          continue as a guest, no account needed.
        </Text>
      </div>
      <LocalizedClientLink
        href="/account"
        data-testid="sign-in-button"
        className="inline-flex h-10 shrink-0 items-center rounded-full border border-aquora-primary/30 bg-white px-5 text-sm font-semibold text-aquora-primary transition-colors hover:bg-aquora-primary/5"
      >
        Sign in
      </LocalizedClientLink>
    </div>
  )
}

export default SignInPrompt
