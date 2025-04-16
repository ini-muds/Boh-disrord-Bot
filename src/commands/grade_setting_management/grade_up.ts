import { ChatInput } from "@akki256/discord-interaction";
import { MessageFlags } from "discord.js";
import { parse } from "comment-json";
import * as fs from "fs";

// load settings.json
const settings: any = parse(fs.readFileSync('settings.json', 'utf-8'));

const gradeUp = new ChatInput(
	{
		name: 'gradeup',
		description: 'Grade up a student',
		defaultMemberPermissions: 'Administrator',
	},
	async (interaction) => {
		// サーバー外で使用された場合
		if (!interaction.inCachedGuild()) {
			await interaction.reply({ content: 'このコマンドはサーバー内でのみ使用できます', flags: MessageFlags.Ephemeral });
			return;
		}
		if (!interaction.memberPermissions.has('Administrator')) {
			await interaction.reply({ content: 'このコマンドは管理者のみ使用できます', flags: MessageFlags.Ephemeral });
			return;
		}
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const gradeList = Object.keys(settings).reverse();
		const gradeUpList = gradeList.slice(1);
		const roleIdList = gradeList.map((grade) => settings[grade].role_id);
		const errorList: string[] = [];
		for (let i = 0; i < gradeUpList.length; i++) {
			const grade = gradeUpList[i];
			const roleId = settings[grade].role_id;
			const nextRoleId = settings[gradeList[i]].role_id;
			const nextGradeName = settings[gradeList[i]].head_name;

			// guild members fetch
			await interaction.guild.members.fetch();
			// 特定のロールを持つメンバーを取得->それぞれのメンバーに対して役職を変更
			(await interaction.guild.roles.fetch()).get(roleId)?.members.map((member) => {
				// role reset(関係するroleをすべて削除(追加するroleを除く))
				// console.log(`${member.nickname} / ${member.displayName}: ${grade} -> ${gradeList[i]}`);
				roleIdList.filter((id) => id !== nextRoleId).map((roleId) => {
					member.roles.remove(roleId).catch((err) => {
						errorList.push(`<@${member.user.id}>: ロールの付与`);
					})
				})
				// role add(次の学年に変更)
				member.roles.add(nextRoleId).catch((err) => {
					errorList.push(`<@${member.user.id}>: ロールの削除`);
				})
				// nickname update(学年の変更)
				// 学年を除外したニックネームを取得 例) [B2]山田太郎 -> 山田太郎
				const username = member.displayName.replace(/\[\w*\]/giu, '');
				// 学年を追加したニックネームを作成 例) 山田太郎 -> [B3]山田太郎
				const updateNickname = `${nextGradeName}${username}`;
				member.setNickname(updateNickname).catch((err) => {
					errorList.push(`<@${member.user.id}>: ニックネーム(学年表記)の変更`);
				})
			})
		}
		await interaction.editReply({ content: 'Grade up Done.' });
		if (errorList.length > 0) {
			await interaction.followUp({ content: `以下のメンバーの学年の変更に失敗しました。手動で変更してください。\n<@${errorList.join('\n')}>`, ephemeral: true });
		}
	})

export default [gradeUp];