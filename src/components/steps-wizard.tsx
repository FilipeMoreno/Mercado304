"use client"

import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Step {
	id: string
	label: string
	description?: string
}

interface StepsWizardProps {
	steps: Step[]
	currentStep: number
	onStepChange: (step: number) => void
	children: React.ReactNode
	onNext?: () => void
	onPrevious?: () => void
	canGoNext?: boolean
	canGoPrevious?: boolean
	allSteps?: Step[] // Array original de todos os steps para referência
	// Exibe spinner e desabilita o botão de avançar/concluir
	isSubmitting?: boolean
}

export function StepsWizard({
	steps,
	currentStep,
	onStepChange,
	children,
	onNext,
	onPrevious,
	canGoNext = true,
	canGoPrevious = true,
	allSteps,
	isSubmitting = false,
}: StepsWizardProps) {
	// Usar allSteps se fornecido, senão usar steps
	const fullSteps = allSteps || steps

	// Encontrar o índice atual nos steps filtrados
	const currentStepData = fullSteps[currentStep]
	const currentFilteredIndex = steps.findIndex((s) => s.id === currentStepData?.id)

	const isLastStep = currentFilteredIndex === steps.length - 1
	const isFirstStep = currentFilteredIndex === 0

	const handleNext = () => {
		if (onNext) {
			onNext()
		} else if (currentStep < steps.length - 1) {
			onStepChange(currentStep + 1)
		}
	}

	const handlePrevious = () => {
		if (onPrevious) {
			onPrevious()
		} else if (currentStep > 0) {
			onStepChange(currentStep - 1)
		}
	}

	return (
		<div className="space-y-8">
			{/* Step Indicator - Horizontal Modern Design */}
			<nav aria-label="Progress" className="px-2">
				<ol className="flex items-center justify-between gap-2">
					{steps.map((step, filteredIndex) => {
						// Encontrar o índice real no array original
						const realIndex = fullSteps.findIndex((s) => s.id === step.id)
						const isActive = realIndex === currentStep
						const isCompleted = currentFilteredIndex > filteredIndex
						const isClickable = isCompleted || isActive

						return (
							<li key={step.id} className="flex items-center flex-1">
								<button
									type="button"
									onClick={() => isClickable && onStepChange(realIndex)}
									disabled={!isClickable}
									className={cn(
										"group flex flex-col items-center gap-3 flex-1 transition-all",
										isClickable && "cursor-pointer hover:opacity-80",
										!isClickable && "cursor-not-allowed opacity-50",
									)}
								>
									{/* Step Number/Icon */}
									<div className="flex items-center gap-2 w-full">
										<div
											className={cn(
												"relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
												isActive && "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20",
												isCompleted && "border-primary bg-primary text-primary-foreground",
												!isActive && !isCompleted && "border-muted-foreground/25 bg-background text-muted-foreground",
											)}
										>
											{isCompleted ? (
												<Check className="h-4 w-4" strokeWidth={3} />
											) : (
												<span>{filteredIndex + 1}</span>
											)}
										</div>

										{/* Connector Line */}
										{filteredIndex < steps.length - 1 && (
											<div
												className={cn(
													"h-[2px] flex-1 transition-all",
													isCompleted ? "bg-primary" : "bg-muted-foreground/25",
												)}
											/>
										)}
									</div>

									{/* Step Label */}
									<div className="text-center space-y-0.5 min-h-[40px]">
										<p
											className={cn(
												"text-xs font-medium leading-tight transition-colors",
												isActive && "text-foreground font-semibold",
												isCompleted && "text-foreground",
												!isActive && !isCompleted && "text-muted-foreground",
											)}
										>
											{step.label}
										</p>
										{step.description && (
											<p
												className={cn(
													"text-[10px] leading-tight transition-colors hidden sm:block",
													isActive ? "text-muted-foreground" : "text-muted-foreground/60",
												)}
											>
												{step.description}
											</p>
										)}
									</div>
								</button>
							</li>
						)
					})}
				</ol>
			</nav>

			{/* Content Area */}
			<div className="min-h-[400px] px-1">
				<div className="animate-in fade-in-50 duration-300">
					{children}
				</div>
			</div>

			{/* Navigation Footer */}
			<div className="flex items-center justify-between gap-4 pt-4 border-t">
				<Button
					type="button"
					variant="outline"
					onClick={handlePrevious}
					disabled={isFirstStep || !canGoPrevious}
					className="min-w-[100px]"
				>
					<ChevronLeft className="mr-2 h-4 w-4" />
					Voltar
				</Button>

				<div className="hidden sm:flex items-center gap-2">
					<div className="text-sm text-muted-foreground font-medium">
						Etapa {currentFilteredIndex + 1} de {steps.length}
					</div>
				</div>

                <Button
					type="button"
					onClick={handleNext}
					disabled={!canGoNext || isSubmitting}
					className={cn(
						"min-w-[100px]",
						isLastStep && "bg-green-600 hover:bg-green-700",
					)}
				>
					{isSubmitting ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							{isLastStep ? "Concluindo..." : "Avançando..."}
						</>
					) : (
						<>
							{isLastStep ? "Concluir" : "Avançar"}
							{!isLastStep && <ChevronRight className="ml-2 h-4 w-4" />}
						</>
					)}
				</Button>
			</div>
		</div>
	)
}

