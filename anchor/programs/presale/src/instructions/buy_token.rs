use anchor_lang::{prelude::*, system_program};
use anchor_spl::token_interface::Mint;

use crate::constants::{PRESALE_SEED, PRESALE_VAULT, USER_SEED};
use crate::errors::PresaleError;
use crate::state::{PresaleInfo, UserInfo};

pub fn buy_token(ctx: Context<BuyToken>, quote_amount: u64) -> Result<()> {
    let presale_info = &mut ctx.accounts.presale_info;
    let mint_account = &mut ctx.accounts.mint_account;
    let user_info = &mut ctx.accounts.user_info;
    let presale_vault = &mut ctx.accounts.presale_vault;
    let cur_timestamp = u64::try_from(Clock::get()?.unix_timestamp).unwrap();

    // get time and compare with start and end time
    if presale_info.start_time > cur_timestamp {
        msg!("current time: {}", cur_timestamp);
        msg!("start time: {}", presale_info.start_time);
        return Err(PresaleError::PresaleNotStarted.into());
    }

    if presale_info.end_time < cur_timestamp {
        msg!("start time: {}", presale_info.start_time);
        msg!("end time: {}", presale_info.end_time);
        msg!("current time: {}", cur_timestamp);
        return Err(PresaleError::PresaleEnded.into());
    }

    // Calculate the token amount
    let token_amount = (quote_amount * mint_account.decimals as u64) / presale_info.price_per_token;
    if token_amount > presale_info.deposit_token_amount - presale_info.sold_token_amount {
        msg!("token amount: {}", token_amount);
        msg!(
            "rest token amount in presale: {}",
            presale_info.deposit_token_amount - presale_info.sold_token_amount
        );
        return Err(PresaleError::InsufficientFund.into());
    }

    // limit the token_amount per address
    if presale_info.max_token_amount_per_address < (user_info.buy_token_amount + token_amount) {
        msg!(
            "max token amount per address: {}",
            presale_info.max_token_amount_per_address
        );
        msg!(
            "token amount to buy: {}",
            user_info.buy_token_amount + token_amount
        );
        return Err(PresaleError::InsufficientFund.into());
    }

    // limit the presale to hardcap
    if presale_info.is_hard_capped == true {
        return Err(PresaleError::HardCapped.into());
    }

    // send SOL to contract and update the user info
    user_info.buy_time = cur_timestamp;
    user_info.buy_quote_amount = user_info.buy_quote_amount + quote_amount;
    user_info.buy_token_amount = user_info.buy_token_amount + token_amount;

    presale_info.sold_token_amount = presale_info.sold_token_amount + token_amount;

    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: presale_vault.to_account_info(),
            },
        ),
        quote_amount,
    )?;

    msg!("Presale tokens transferred successfully.");

    // show softcap status
    if presale_vault.get_lamports() > presale_info.softcap_amount {
        presale_info.is_soft_capped = true;
        msg!("Presale is softcapped");
    }

    // show hardcap status
    if presale_vault.get_lamports() > presale_info.hardcap_amount {
        presale_info.is_hard_capped = true;
        msg!("Presale is hardcapped");
    }

    Ok(())
}

#[derive(Accounts)]
pub struct BuyToken<'info> {
    #[account(mut)]
    pub mint_account: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        constraint = presale_info.token_mint_address == mint_account.key() @ PresaleError::NotAllowed,
        seeds = [PRESALE_SEED],
        bump
    )]
    pub presale_info: Box<Account<'info, PresaleInfo>>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + std::mem::size_of::<UserInfo>(),
        seeds = [USER_SEED],
        bump
    )]
    pub user_info: Box<Account<'info, UserInfo>>,

    /// CHECK: This is not dangerous
    #[account(
        mut,
        seeds = [PRESALE_VAULT, presale_info.key().as_ref()],
        bump,
    )]
    pub presale_vault: AccountInfo<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
