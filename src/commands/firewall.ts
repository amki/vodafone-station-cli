import {Flags} from '@oclif/core'
import Command from '../base-command'
import {discoverModemIp, ModemDiscovery} from '../modem/discovery'
import {modemFactory} from '../modem/factory'

export default class Firewall extends Command {
  static description =
    'turn on/off the firewall';

  static examples = [
    '$ vodafone-station-cli firewall -a off -p PASSWORD',
  ];


  static flags = {
    action: Flags.string({
      char: 'a',
      options: ['on', 'off'],
      description: 'firewall action',
    }),
    password: Flags.string({
      char: 'p',
      description: 'router/modem password',
    }),
  };

  async firewallAction(password: string, action:boolean): Promise<void> {
    const modemIp = await discoverModemIp()
    const discoveredModem = await new ModemDiscovery(modemIp, this.logger).discover()
    const modem = modemFactory(discoveredModem, this.logger)
    try {
      await modem.login(password)
      await modem.firewall(action);
    } catch (error) {
      this.log('Something went wrong.', error)
    } finally {
      action ? this.log('Firewall is now enabled') : this.log('Firewall is now disabled')
      await modem.logout()
    }
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Firewall)

    const password = flags.password ?? process.env.VODAFONE_ROUTER_PASSWORD
    const action = flags.action === "off" ? false : true
    if (!password || password === '') {
      this.log(
        'You must provide a password either using -p or by setting the environment variable VODAFONE_ROUTER_PASSWORD'
      )
      this.exit()
    }
    await this.firewallAction(password!, action)
    this.exit()
  }
}
