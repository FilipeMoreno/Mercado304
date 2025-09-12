"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Download, Eye, EyeOff, Shield, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface BackupCodesDisplayProps {
	codes: string[];
	onComplete?: () => void;
	title?: string;
	description?: string;
}

export function BackupCodesDisplay({ codes, onComplete, title, description }: BackupCodesDisplayProps) {
	const [showCodes, setShowCodes] = useState(false);

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Código copiado para a área de transferência");
	};

	const copyAllCodes = () => {
		const allCodes = codes.join('\n');
		navigator.clipboard.writeText(allCodes);
		toast.success("Todos os códigos foram copiados");
	};

	const downloadCodes = () => {
		const codesText = codes.join('\n');
		const blob = new Blob([codesText], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'mercado304-backup-codes.txt';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		toast.success("Códigos de backup baixados!");
	};

	const printCodes = () => {
		const printWindow = window.open('', '_blank');
		if (!printWindow) return;
		
		printWindow.document.write(`
			<html>
				<head>
					<title>Códigos de Backup - Mercado304</title>
					<style>
						body { font-family: Arial, sans-serif; margin: 40px; }
						h1 { color: #2563eb; margin-bottom: 20px; }
						.warning { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
						.codes { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 20px 0; }
						.code { font-family: monospace; font-size: 14px; padding: 8px; background: #f3f4f6; border-radius: 4px; }
						.footer { margin-top: 30px; font-size: 12px; color: #6b7280; }
					</style>
				</head>
				<body>
					<h1>Códigos de Backup - Mercado304</h1>
					<div class="warning">
						<strong>⚠️ IMPORTANTE:</strong>
						<ul>
							<li>Cada código só pode ser usado uma vez</li>
							<li>Guarde estes códigos em local seguro</li>
							<li>Não compartilhe com ninguém</li>
							<li>Use apenas se não conseguir acessar seu aplicativo authenticator</li>
						</ul>
					</div>
					<div class="codes">
						${codes.map(code => `<div class="code">${code}</div>`).join('')}
					</div>
					<div class="footer">
						Gerado em: ${new Date().toLocaleString('pt-BR')}<br>
						Mercado304 - Sistema de Gestão de Compras
					</div>
				</body>
			</html>
		`);
		
		printWindow.document.close();
		printWindow.focus();
		printWindow.print();
		printWindow.close();
		
		toast.success("Códigos enviados para impressão");
	};

	return (
		<Card className="w-full">
			<CardHeader className="text-center">
				<div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
					<Shield className="h-6 w-6 text-green-600" />
				</div>
				<CardTitle>{title || "Códigos de Backup Gerados"}</CardTitle>
				<CardDescription>
					{description || "Seus novos códigos de backup foram gerados com sucesso"}
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-6">
				<Alert className="border-red-200 bg-red-50">
					<Shield className="h-4 w-4 text-red-600" />
					<AlertDescription className="text-red-800">
						<div className="space-y-2">
							<p className="font-medium">⚠️ Instruções Importantes:</p>
							<ul className="text-sm space-y-1 ml-4">
								<li>• Cada código só pode ser usado uma vez</li>
								<li>• Armazene em local seguro (gerenciador de senhas recomendado)</li>
								<li>• Não compartilhe estes códigos com ninguém</li>
								<li>• Use apenas se não conseguir acessar seu authenticator</li>
								<li>• Substitua os códigos antigos por estes novos</li>
							</ul>
						</div>
					</AlertDescription>
				</Alert>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="font-medium">Códigos de Backup ({codes.length})</h3>
						<div className="flex space-x-2">
							<Button
								size="sm"
								variant="outline"
								onClick={() => setShowCodes(!showCodes)}
							>
								{showCodes ? (
									<>
										<EyeOff className="h-4 w-4 mr-1" />
										Ocultar
									</>
								) : (
									<>
										<Eye className="h-4 w-4 mr-1" />
										Mostrar
									</>
								)}
							</Button>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						{codes.map((code, index) => (
							<div key={index} className="relative">
								<Badge
									variant="secondary"
									className="w-full justify-between p-3 font-mono text-sm cursor-pointer hover:bg-secondary/80 transition-colors"
									onClick={() => copyToClipboard(code)}
								>
									<span>{showCodes ? code : '••••••••••••'}</span>
									<Copy className="h-3 w-3 ml-2 opacity-50" />
								</Badge>
							</div>
						))}
					</div>

					{showCodes && (
						<Alert className="bg-green-50 border-green-200">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<AlertDescription className="text-green-800">
								<strong>Códigos visíveis!</strong> Certifique-se de que ninguém mais está vendo sua tela.
								Clique em qualquer código para copiá-lo.
							</AlertDescription>
						</Alert>
					)}
				</div>
			</CardContent>

			<CardFooter className="flex flex-col space-y-3">
				<div className="grid grid-cols-3 gap-2 w-full">
					<Button
						variant="outline"
						onClick={copyAllCodes}
						className="flex items-center justify-center"
					>
						<Copy className="h-4 w-4 mr-2" />
						Copiar Todos
					</Button>
					
					<Button
						variant="outline"
						onClick={downloadCodes}
						className="flex items-center justify-center"
					>
						<Download className="h-4 w-4 mr-2" />
						Baixar
					</Button>

					<Button
						variant="outline"
						onClick={printCodes}
						className="flex items-center justify-center"
					>
						🖨️
						Imprimir
					</Button>
				</div>

				<Button 
					onClick={onComplete}
					className="w-full"
					size="lg"
				>
					Concluir - Códigos Salvos
				</Button>

				<p className="text-xs text-muted-foreground text-center">
					Recomendamos salvar estes códigos em seu gerenciador de senhas ou imprimi-los
					e guardá-los em local físico seguro.
				</p>
			</CardFooter>
		</Card>
	);
}