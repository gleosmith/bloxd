/**
 * A lifecycle hook that is executed after the options are parsed from the raw cli arguments and bound to
 * the options instance. Occurs before the modules and commands in the execution path are instantiated. Implementation can be
 * synchronous or asynchronous. This provides a means of layering customized functionality on top of options, such
 * as configuring providers, additional validation, implementing default behavior and implementing input prompts.
 */
export interface AfterOptionsInit {

    /**
     * A lifecycle hook that is executed after the options are parsed from the raw cli arguments and bound to
     * the options instance. Occurs before the modules and commands in the execution path are instantiated. Implementation can be
     * synchronous or asynchronous. This provides a means of layering customized functionality on top of options, such
     * as configuring providers, additional validation, implementing default behavior and implementing input prompts.
     */
    afterOptionsInit(): Promise<any> | any;

}
