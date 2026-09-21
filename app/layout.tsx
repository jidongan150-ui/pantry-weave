import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"Pantry Weave · Recipe shopping list",description:"Combine recipes into one shopping list. Scale servings, combine ingredients, and check off what you already have.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
