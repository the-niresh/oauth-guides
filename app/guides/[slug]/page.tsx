import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGuide, getVerification } from "@/lib/store";
import { GuideView } from "@/components/GuideView";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const found = await getGuide((await params).slug);
  return found
    ? { title: `${found.guide.app} OAuth app setup`, description: found.guide.summary }
    : { title: "Guide not found" };
}

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const found = await getGuide(slug);
  if (!found) notFound();
  const v = await getVerification(slug);
  return <GuideView g={found.guide} v={v} inLibrary={found.inLibrary} />;
}
