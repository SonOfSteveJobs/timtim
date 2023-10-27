import { Ctx, Start, Update, On, Hears } from "nestjs-telegraf";
import { Markup, Scenes, Telegraf, } from "telegraf";
import { getKeyboardOptions } from './lib/create-keyboard';
import { PrismaService } from "@/prisma/prisma.service";
import { options } from "./bot-config.factory";
import { ConfigService } from "@nestjs/config";

type Context = Scenes.SceneContext

@Update()
export class BotService extends Telegraf<Context> {
    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) {
        super(config.get('BOT_TOKEN'));
    }
    @Start()
    async onStart(@Ctx() ctx: Context) {
        console.log(ctx.update?.["message"])
        const user = await this.prisma.user.findUnique({
            where: {
                username: ctx.from.username
            }
        });

        if (!user) {
            const user = await this.prisma.user.create({
                data: {
                    username: ctx.from.username,
                    first_name: ctx.from.first_name,
                    last_name: ctx.from?.last_name || null,
                    chat_id: ctx.update?.["message"].chat.id
                }
            });
        }

        const options = getKeyboardOptions(
            'keyboard',
            [[{ text: 'Вариант 1' }], [{ text: 'Вариант 2' }], [{ text: 'Вариант 3' }], [{ text: 'Вариант 4' }]]
        )

        await ctx.replyWithMarkdownV2(
            `Welcome, ${ctx.from.first_name}\\. Тут всякие штуки про йогу\\.`,
            //@ts-ignore
            options
        )

        if (user.is_admin) {
            const options = getKeyboardOptions(
                'inline_keyboard',
                [[{ text: 'Отправить привет всем юзерам', callback_data: 'admin_send_hi' }]]
            )

            await ctx.replyWithMarkdownV2(
                'Управление ботом',
                //@ts-ignore
                options
            )
        }


    }

    @On('callback_query')
    async broadcastMessage(message: string) {
        const users = await this.prisma.user.findMany();

        for (const user of users) {
            try {
                await this.telegram.sendMessage(user.chat_id, 'ПРИВЕТИК');
            } catch (error) {
                console.error(`Failed to send message to ${user.username}: `, error);
            }
        }
    }
    async onCallback(@Ctx() ctx: Context) {
        const data = ctx.callbackQuery?.['data'];

        switch (data) {
            case 'option1':
                ctx.reply('Вы выбрали Вариант 1');
                break;
            case 'option2':
                ctx.reply('Вы выбрали Вариант 2');
                break;
            case 'option3':
                ctx.reply('Вы выбрали Вариант 3');
                break;
            case 'option4':
                ctx.reply('Вы выбрали Вариант 4');
                break;
            case 'admin_send_hi':
                await this.broadcastMessage('Привет всем пользователям!');
                ctx.reply('Сообщение отправлено.');
                break;
            default:
                ctx.reply('Неизвестная опция');
        }
    }

    @Hears('Вариант 1')
    async onOption1(@Ctx() ctx: Context) {
        await ctx.reply('Вы выбрали Вариант 1');
    }

    @Hears('Вариант 2')
    async onOption2(@Ctx() ctx: Context) {
        await ctx.reply('Вы выбрали Вариант 2');
    }

    @Hears('Вариант 3')
    async onOption3(@Ctx() ctx: Context) {
        await ctx.reply('Вы выбрали Вариант 3');
    }

    @Hears('Вариант 4')
    async onOption4(@Ctx() ctx: Context) {
        await ctx.reply('Вы выбрали Вариант 4');
    }
}
