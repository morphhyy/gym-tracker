import Image from "next/image";

export function DumbbellIcon() {
  return (
    <Image
      priority
      src="/dumbbellai.png"
      alt="Dumbbell"
      width={32}
      height={32}
      className='rounded-md' />
  );
}
