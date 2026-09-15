import Image from "next/image";

export function Header() {
  return (
    <header className="border-b border-grey-light-07 bg-beige">
      <div className="mx-auto flex h-16 max-w-[1312px] items-center justify-between px-4 md:px-8 lg:px-16">
        <a
          href="https://kernel.sh"
          target="_blank"
          rel="noreferrer"
          className="no-underline"
        >
          <Image
            src="/brand/logo-kernel-green.svg"
            alt="KERNEL"
            width={293}
            height={62}
            priority
            className="h-5 w-auto"
          />
        </a>

        <Image
          src="/vercel-logo.svg"
          alt="Vercel"
          width={262}
          height={52}
          className="h-3 w-auto"
        />
      </div>
    </header>
  );
}
