"use client"
import { authClient } from "@/lib/auth-client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
} from "./ui/sidebar"

import { Calendar, Home, Inbox, MessageCircle, Search, Settings } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { get_conv_ids } from "@/lib/action"
import { Avatar, AvatarImage } from "./ui/avatar"
import { Skeleton } from "./ui/skeleton"


export function SpecSidebar() {
	const router = useRouter();

	const {
		data: session,
		isPending, //loading state
		error, //error object
		refetch //refetch the session
	} = authClient.useSession()

	const [username, setUsername] = useState("")
	const [profileP, setProfileP] = useState("");
	const [ids, setConvIds] = useState([]);
	const [chatsLoading, setChatsLoading] = useState(true)

	useEffect(() => {
		async function getConvo(user_id: string) {
			const a = await get_conv_ids({ user_id: user_id })
			setChatsLoading((s) => true)
			setConvIds((id) => a.ids)
			setChatsLoading((s) => false)
		}
		if (session) {
			try {
				const user_id = session.user.id;
				setProfileP((s) => session.user.image)
				setUsername((e) => session.user.name);
				getConvo(user_id);
			} catch (event) {
			}
		}
	}, [session, isPending])


	async function handleSignOut() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/login");
				}
			}
		});
	}

	return (
		<Sidebar className="min-h-screen">
			{/* <SidebarHeader> */}
			{/* 	<SidebarMenu> */}
			{/* 		<SidebarMenuItem> */}
			{/* 			<SidebarMenuButton size="lg" className="p-2 font-merri font-bold text-2xl"> */}
			{/* 				Specter */}
			{/* 			</SidebarMenuButton> */}
			{/* 		</SidebarMenuItem> */}
			{/* 	</SidebarMenu> */}
			{/* </SidebarHeader> */}
			<SidebarContent className="px-2">
				<SidebarGroup>
					<SidebarGroupLabel className="font-inter font-bold flex">
						Chats
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{chatsLoading ? (
								<div className="space-y-2 p-2">
									{[...Array(6)].map((_, index) => (
										<div key={index} className="">
											<Skeleton className="h-8 w-full rounded bg-[#ffffff] border border-color3" />
										</div>
									))}
								</div>
							)
								: (
									ids.map((id) => (
										<SidebarMenuButton size="lg" key={id} className="rounded-xs cursor-pointer hover:bg-color1" onClick={() => { router.push(`/chat/${id}`) }}>
											<p className="font-inter text-xs tracking-tight" onClick={() => { router.push(`/chat/${id}`) }}>{id}</p>
										</SidebarMenuButton>
									))
								)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton size="lg" className="rounded-xs cursor-pointer items-center py-2 tracking-tight bg-color1 inset-shadow-sm/20">
									{isPending ? (
										<>
											<Skeleton className="h-8 w-8 rounded-full" />
											<div className='font-inter text-xs space-y-2'>
												<Skeleton className="h-3 w-20" />
												<Skeleton className="h-3 w-32" />
											</div>
										</>
									) : (
										<>
											<Avatar>
												<AvatarImage src={profileP} alt={"FB"} />
											</Avatar>
											<div className='font-inter text-xs'>
												<p className="font-bold">{username}</p>
												<p>{session?.user.email}</p>
											</div>
										</>
									)}
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="rounded-xs">
								<DropdownMenuItem className="font-inter text-xs tracking-tight rounded-xs" onClick={handleSignOut}>
									<span>SignOut</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	)
}
