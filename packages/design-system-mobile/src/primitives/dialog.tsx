import type { ReactNode } from "react";
import { Modal as RNModal, Text, TouchableOpacity, View } from "react-native";
import { FALLBACK_COLORS } from "../theme/themed.js";

export type DialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	description?: string;
	children?: ReactNode;
	variant?: "modal" | "alert";
};

export type DialogTitleProps = {
	children: ReactNode;
};

export function DialogTitle({ children }: DialogTitleProps) {
	return (
		<Text
			style={{
				fontSize: 18,
				fontWeight: "600",
				color: FALLBACK_COLORS.text,
			}}
		>
			{children}
		</Text>
	);
}

export type DialogDescriptionProps = {
	children: ReactNode;
};

export function DialogDescription({ children }: DialogDescriptionProps) {
	return (
		<Text
			style={{
				fontSize: 14,
				color: FALLBACK_COLORS.text,
				opacity: 0.7,
			}}
		>
			{children}
		</Text>
	);
}

export function Dialog({
	open,
	onOpenChange,
	title,
	description,
	children,
	variant = "modal",
}: DialogProps) {
	return (
		<RNModal
			visible={open}
			transparent
			animationType="fade"
			onRequestClose={() => onOpenChange(false)}
			accessibilityViewIsModal
			aria-modal={true}
		>
			<View
				style={{
					flex: 1,
					backgroundColor: "rgba(0,0,0,0.5)",
					justifyContent: "center",
					alignItems: "center",
					padding: 24,
				}}
			>
				<View
					style={{
						width: "100%",
						maxWidth: 500,
						backgroundColor: FALLBACK_COLORS.surface,
						borderRadius: 8,
						borderWidth: 1,
						borderColor: FALLBACK_COLORS.border,
						padding: 24,
						gap: 16,
					}}
					role="dialog"
					aria-label={title}
				>
					{title && <DialogTitle>{title}</DialogTitle>}
					{description && <DialogDescription>{description}</DialogDescription>}
					{children}
					{variant === "alert" && (
						<View
							style={{
								flexDirection: "row",
								justifyContent: "flex-end",
								gap: 8,
								marginTop: 8,
							}}
						>
							<TouchableOpacity
								onPress={() => onOpenChange(false)}
								activeOpacity={0.7}
								style={{
									paddingHorizontal: 16,
									paddingVertical: 8,
									borderRadius: 6,
									backgroundColor: FALLBACK_COLORS.primary,
								}}
							>
								<Text
									style={{
										color: FALLBACK_COLORS.textInverse,
										fontWeight: "500",
									}}
								>
									OK
								</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>
			</View>
		</RNModal>
	);
}
